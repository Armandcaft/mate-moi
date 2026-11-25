import { and, asc, desc, eq, inArray, isNotNull, isNull } from 'drizzle-orm';
import {
	gamesPerPairFor,
	gamesPerPairIn,
	groupSchedule,
	joinerSchedule,
	nextStep,
	rank,
	table,
	type Game,
	type Line,
	type Result,
	type Step
} from '../tournament';
import { db, games, players, weeks, type GameRow, type Player, type Week } from './db';

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export class LeagueError extends Error {}

/**
 * What other players may see about someone. Pages send their data to the browser, so a query
 * feeding one selects these columns, never the whole row (which holds the code hash).
 */
export type PublicPlayer = Pick<Player, 'id' | 'name' | 'active' | 'slogan'>;
const publicColumns = {
	id: players.id,
	name: players.name,
	active: players.active,
	slogan: players.slogan
};

/** A row as the engine sees it: only a confirmed result counts. */
const toGame = (g: GameRow): Game => ({
	stage: g.stage,
	round: g.round,
	whiteId: g.whiteId,
	blackId: g.blackId,
	armageddon: g.armageddon,
	result: g.confirmedAt ? g.result : null
});

const weekGames = (tx: Tx | typeof db, weekId: number) =>
	tx.select().from(games).where(eq(games.weekId, weekId)).orderBy(asc(games.id)).all();

const weekPlayerIds = (rows: GameRow[]) => [
	...new Set(rows.filter((g) => g.stage === 'group').flatMap((g) => [g.whiteId, g.blackId]))
];

// ── Reads ───────────────────────────────────────────────────────────────────────

export function activePlayers(): PublicPlayer[] {
	return db.select(publicColumns).from(players).where(eq(players.active, true)).orderBy(asc(players.name)).all();
}

export function latestWeek(): Week | undefined {
	return db.select().from(weeks).orderBy(desc(weeks.number)).limit(1).get();
}

export interface WeekView {
	week: Week;
	players: Map<number, PublicPlayer>;
	/** Group-stage table, best first, with a shared rank for players nothing separates. */
	standings: (Line & { rank: number })[];
	games: GameRow[];
	step: Step;
	/** Games against each opponent this week (3, 2 or 1, set by the group's size at the start). */
	gamesPerPair: number;
}

export function weekView(week: Week): WeekView {
	const rows = weekGames(db, week.id);
	const ids = weekPlayerIds(rows);
	const engineGames = rows.map(toGame);
	const group = engineGames.filter((g) => g.stage === 'group');
	const playoff = engineGames.filter((g) => g.stage === 'playoff');

	const lines = new Map(table(ids, group).map((l) => [l.playerId, l]));
	const standings: WeekView['standings'] = [];
	for (const tier of rank(ids, group, playoff)) {
		const r = standings.length + 1;
		for (const id of tier) standings.push({ ...lines.get(id)!, rank: r });
	}

	const named = ids.length
		? db.select(publicColumns).from(players).where(inArray(players.id, ids)).all()
		: [];

	return {
		week,
		players: new Map(named.map((p) => [p.id, p])),
		standings,
		games: rows,
		step: nextStep(ids, engineGames),
		gamesPerPair: gamesPerPairIn(rows)
	};
}

export interface Hall {
	reigns: { number: number; kingId: number; closedAt: Date | null }[];
	crowns: Map<number, number>;
	/** All-time group-stage table over every week. */
	allTime: Line[];
	/** `h2h.get(a)?.get(b)` = a's record against b, all stages. */
	h2h: Map<number, Map<number, { w: number; d: number; l: number }>>;
	players: PublicPlayer[];
}

export function hall(): Hall {
	const everyone = db.select(publicColumns).from(players).orderBy(asc(players.name)).all();
	const reigns = db
		.select({ number: weeks.number, kingId: weeks.kingId, closedAt: weeks.closedAt })
		.from(weeks)
		.where(isNotNull(weeks.kingId))
		.orderBy(desc(weeks.number))
		.all() as Hall['reigns'];

	const crowns = new Map<number, number>();
	for (const r of reigns) crowns.set(r.kingId, (crowns.get(r.kingId) ?? 0) + 1);

	const confirmed = db.select().from(games).where(isNotNull(games.confirmedAt)).all().map(toGame);
	const ids = everyone.map((p) => p.id);
	const allTime = table(
		ids,
		confirmed.filter((g) => g.stage === 'group')
	).sort((a, b) => b.points - a.points || b.wins - a.wins);

	const h2h: Hall['h2h'] = new Map(ids.map((id) => [id, new Map()]));
	const bump = (a: number, b: number, k: 'w' | 'd' | 'l') => {
		const rec = h2h.get(a)?.get(b) ?? { w: 0, d: 0, l: 0 };
		rec[k]++;
		h2h.get(a)?.set(b, rec);
	};
	for (const g of confirmed) {
		if (g.result === '1/2-1/2') {
			bump(g.whiteId, g.blackId, 'd');
			bump(g.blackId, g.whiteId, 'd');
		} else {
			const [w, l] = g.result === '1-0' ? [g.whiteId, g.blackId] : [g.blackId, g.whiteId];
			bump(w, l, 'w');
			bump(l, w, 'l');
		}
	}

	return { reigns, crowns, allTime, h2h, players: everyone };
}

// ── Writes ──────────────────────────────────────────────────────────────────────

export function startWeek(): Week {
	return db.transaction((tx) => {
		const open = tx.select().from(weeks).where(isNull(weeks.closedAt)).get();
		if (open) throw new LeagueError('La semaine en cours n’est pas terminée.');

		const ids = tx.select({ id: players.id }).from(players).where(eq(players.active, true)).all();
		if (ids.length < 2) throw new LeagueError('Il faut au moins deux joueurs.');

		const last = tx.select().from(weeks).orderBy(desc(weeks.number)).limit(1).get();
		const number = (last?.number ?? 0) + 1;
		const week = tx.insert(weeks).values({ number }).returning().get();

		const schedule = groupSchedule(
			ids.map((p) => p.id),
			gamesPerPairFor(ids.length),
			number
		);
		tx.insert(games)
			.values(schedule.map((g) => ({ ...g, weekId: week.id })))
			.run();
		return week;
	});
}

function loadForUpdate(tx: Tx, gameId: number, playerId: number) {
	const game = tx.select().from(games).where(eq(games.id, gameId)).get();
	// The same answer for "no such game" and "not your game": it tells a stranger nothing.
	if (!game || (game.whiteId !== playerId && game.blackId !== playerId))
		throw new LeagueError('Partie introuvable.');
	const week = tx.select().from(weeks).where(eq(weeks.id, game.weekId)).get()!;
	if (week.closedAt) throw new LeagueError('Cette semaine est terminée.');
	if (game.confirmedAt) throw new LeagueError('Ce résultat est déjà confirmé.');
	return game;
}

/** Either player reports; it counts once the other confirms. Re-reporting replaces a pending result. */
export function reportResult(gameId: number, playerId: number, result: Result) {
	db.transaction((tx) => {
		const game = loadForUpdate(tx, gameId, playerId);
		if (game.armageddon && result === '1/2-1/2')
			throw new LeagueError('En Armageddon, la nulle compte comme une victoire des Noirs.');
		tx.update(games)
			.set({ result, reportedById: playerId, reportedAt: new Date(), confirmedAt: null })
			.where(eq(games.id, gameId))
			.run();
	});
}

export function confirmResult(gameId: number, playerId: number) {
	db.transaction((tx) => {
		const game = loadForUpdate(tx, gameId, playerId);
		if (!game.result) throw new LeagueError('Aucun résultat à confirmer.');
		if (game.reportedById === playerId)
			throw new LeagueError('C’est à ton adversaire de confirmer.');
		tx.update(games).set({ confirmedAt: new Date() }).where(eq(games.id, gameId)).run();
		advance(tx, game.weekId);
	});
}

/** The opponent disputes a pending result: it is cleared and must be reported again. */
export function rejectResult(gameId: number, playerId: number) {
	db.transaction((tx) => {
		const game = loadForUpdate(tx, gameId, playerId);
		if (!game.result || game.reportedById === playerId)
			throw new LeagueError('Aucun résultat à contester.');
		tx.update(games)
			.set({ result: null, reportedById: null, reportedAt: null })
			.where(and(eq(games.id, gameId), isNull(games.confirmedAt)))
			.run();
	});
}

/** Create whatever games the week needs next, or crown its king. */
function advance(tx: Tx, weekId: number) {
	const rows = weekGames(tx, weekId);
	const step = nextStep(weekPlayerIds(rows), rows.map(toGame));
	if (step.create.length)
		tx.insert(games)
			.values(step.create.map((g) => ({ ...g, weekId })))
			.run();
	if (step.phase === 'done')
		tx.update(weeks).set({ kingId: step.king, closedAt: new Date() }).where(eq(weeks.id, weekId)).run();
}

/**
 * A newcomer joins the open week while its group stage is still being played: their games against
 * everyone are added, keeping it a full round-robin. Once the play-off or final has started there
 * is nothing fair left to join, so they start with the next week.
 */
export function joinCurrentWeek(tx: Tx, playerId: number): 'joined' | 'next-week' {
	const week = tx.select().from(weeks).where(isNull(weeks.closedAt)).get();
	if (!week) return 'next-week'; // no week running: the next one includes every active player
	const rows = weekGames(tx, week.id);
	const ids = weekPlayerIds(rows);
	if (ids.includes(playerId)) return 'joined';
	if (nextStep(ids, rows.map(toGame)).phase !== 'group') return 'next-week';

	// The week's own count, set when it started: the newcomer plays everyone as often as they did.
	const added = joinerSchedule(ids, playerId, gamesPerPairIn(rows), week.number);
	tx.insert(games)
		.values(added.map((g) => ({ ...g, weekId: week.id })))
		.run();
	return 'joined';
}
