import { and, asc, desc, eq, inArray, isNotNull, isNull } from 'drizzle-orm';
import {
	REPORTABLE,
	WEEK_MS,
	departures,
	dueAt,
	gamesPerPairFor,
	gamesPerPairIn,
	groupSchedule,
	joinerSchedule,
	nextStep,
	nothingDue,
	playerStats,
	rank,
	table,
	type Game,
	type Line,
	type PlayerStats,
	type Result,
	type Step,
	type TimedGame
} from '../tournament';
import type { MessageKey, Problem } from '../i18n/index.ts';
import type { LeagueEvent } from '../push-messages.ts';
import { db, games, players, weeks, type GameRow, type Player, type Week } from './db';
import { notify } from './push.ts';

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** A refusal, carrying a message key: the page puts it in the player's language. */
export class LeagueError extends Error implements Problem {
	constructor(readonly key: MessageKey) {
		super(key);
	}
}

/**
 * What other players may see about someone. Pages send their data to the browser, so a query
 * feeding one selects these columns, never the whole row (which holds the code hash).
 */
export type PublicPlayer = Pick<Player, 'id' | 'name' | 'active' | 'slogan' | 'deletedAt'>;
const publicColumns = {
	id: players.id,
	name: players.name,
	active: players.active,
	slogan: players.slogan,
	/** Set: show "deleted player" instead of the name (`playerName` in `format.ts`). */
	deletedAt: players.deletedAt
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
	/** Streaks, win rate, bête noire and tête de Turc of each active player, all stages. */
	stats: PlayerStats[];
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

	const rows = db.select().from(games).where(isNotNull(games.confirmedAt)).all();
	const confirmed = rows.map(toGame);
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
		} else if (g.result === '0-0') {
			// Not played by the deadline: a loss for both.
			bump(g.whiteId, g.blackId, 'l');
			bump(g.blackId, g.whiteId, 'l');
		} else {
			const [w, l] = g.result === '1-0' ? [g.whiteId, g.blackId] : [g.blackId, g.whiteId];
			bump(w, l, 'w');
			bump(l, w, 'l');
		}
	}

	const statGames = rows.map((g) => ({
		id: g.id,
		whiteId: g.whiteId,
		blackId: g.blackId,
		result: g.result!,
		confirmedAt: g.confirmedAt!.getTime()
	}));
	const stats = everyone
		.filter((p) => p.active && !p.deletedAt)
		.map((p) => playerStats(p.id, statGames))
		.filter((s) => s.played > 0);

	return { reigns, crowns, allTime, h2h, players: everyone, stats };
}

// ── Writes ──────────────────────────────────────────────────────────────────────

export function startWeek(): Week {
	return db.transaction((tx) => {
		const open = tx.select().from(weeks).where(isNull(weeks.closedAt)).get();
		if (open) throw new LeagueError('league.weekNotOver');

		const ids = tx.select({ id: players.id }).from(players).where(eq(players.active, true)).all();
		if (ids.length < 2) throw new LeagueError('league.needTwoPlayers');

		const last = tx.select().from(weeks).orderBy(desc(weeks.number)).limit(1).get();
		const number = (last?.number ?? 0) + 1;
		const deadline = new Date(Date.now() + WEEK_MS);
		const week = tx.insert(weeks).values({ number, deadline }).returning().get();

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
		throw new LeagueError('league.gameNotFound');
	const week = tx.select().from(weeks).where(eq(weeks.id, game.weekId)).get()!;
	if (week.closedAt) throw new LeagueError('league.weekOver');
	if (game.confirmedAt) throw new LeagueError('league.alreadyConfirmed');
	return game;
}

/** Either player reports; it counts once the other confirms. Re-reporting replaces a pending result. */
export function reportResult(gameId: number, playerId: number, result: Result) {
	const game = db.transaction((tx) => {
		const game = loadForUpdate(tx, gameId, playerId);
		if (!REPORTABLE.includes(result)) throw new LeagueError('league.unknownResult');
		if (game.armageddon && result === '1/2-1/2')
			throw new LeagueError('league.armageddonDraw');
		tx.update(games)
			.set({ result, reportedById: playerId, reportedAt: new Date(), confirmedAt: null })
			.where(eq(games.id, gameId))
			.run();
		return game;
	});
	notify([{ type: 'reported', reporterId: playerId, whiteId: game.whiteId, blackId: game.blackId, result }]);
}

export function confirmResult(gameId: number, playerId: number) {
	const events: LeagueEvent[] = [];
	db.transaction((tx) => {
		const game = loadForUpdate(tx, gameId, playerId);
		if (!game.result) throw new LeagueError('league.nothingToConfirm');
		if (game.reportedById === playerId)
			throw new LeagueError('league.opponentConfirms');
		tx.update(games).set({ confirmedAt: new Date() }).where(eq(games.id, gameId)).run();
		advance(tx, game.weekId, events);
	});
	notify(events);
}

/** The opponent disputes a pending result: it is cleared and must be reported again. */
export function rejectResult(gameId: number, playerId: number) {
	db.transaction((tx) => {
		const game = loadForUpdate(tx, gameId, playerId);
		if (!game.result || game.reportedById === playerId)
			throw new LeagueError('league.nothingToDispute');
		tx.update(games)
			.set({ result: null, reportedById: null, reportedAt: null })
			.where(and(eq(games.id, gameId), isNull(games.confirmedAt)))
			.run();
	});
}

/**
 * Create whatever games the week needs next, or crown its king (or end it with none, when fewer
 * than two players are left).
 *
 * First, anyone in the week who has left the league (archived or deleted: `active` false) is
 * settled by `departures`: their group games are dropped, or their unfinished knock-out games
 * forfeited. That can finish a stage, and the games created next may be theirs again (a play-off
 * round, the final), so it repeats until the week has nothing more to do.
 */
function advance(tx: Tx, weekId: number, events: LeagueEvent[]) {
	for (let pass = 0; pass < 100; pass++) {
		const rows = weekGames(tx, weekId);
		const ids = weekPlayerIds(rows);
		const engineGames = rows.map(toGame);

		const gone = new Set(
			ids.length
				? tx
						.select({ id: players.id })
						.from(players)
						.where(and(inArray(players.id, ids), eq(players.active, false)))
						.all()
						.map((p) => p.id)
				: []
		);
		const leave = departures(ids, engineGames, gone);
		if (leave.drop.length) {
			tx.delete(games)
				.where(inArray(games.id, leave.drop.map((i) => rows[i].id)))
				.run();
			continue;
		}
		if (leave.forfeit.length) {
			const now = new Date();
			for (const { index, result } of leave.forfeit) {
				const g = rows[index];
				// Reported by the opponent who wins it, unless they left too.
				const winner = result === '1-0' ? g.whiteId : g.blackId;
				tx.update(games)
					.set({ result, reportedById: gone.has(winner) ? null : winner, reportedAt: now, confirmedAt: now })
					.where(eq(games.id, g.id))
					.run();
			}
			continue;
		}

		const step = nextStep(ids, engineGames);
		if (step.create.length) {
			tx.insert(games)
				.values(step.create.map((g) => ({ ...g, weekId })))
				.run();
			if (step.phase === 'final')
				events.push({ type: 'final', finalists: step.finalists, armageddon: step.create[0].armageddon });
			continue;
		}
		if (step.phase === 'done') {
			const week = tx
				.update(weeks)
				.set({ kingId: step.king, closedAt: new Date() })
				.where(eq(weeks.id, weekId))
				.returning({ number: weeks.number })
				.get();
			events.push({ type: 'king', kingId: step.king, week: week.number });
		}
		if (step.phase === 'abandoned')
			tx.update(weeks).set({ kingId: null, closedAt: new Date() }).where(eq(weeks.id, weekId)).run();
		return;
	}
	throw new Error(`week ${weekId}: advance did not settle`);
}

const ms = (d: Date | null) => (d ? d.getTime() : null);
const timed = (g: GameRow): TimedGame => ({
	id: g.id,
	stage: g.stage,
	result: g.result,
	reportedAt: ms(g.reportedAt),
	confirmedAt: ms(g.confirmedAt)
});

/**
 * Apply every rule that time has made due, then move the week on: a result nobody answered for
 * 48 h counts as reported; once the group stage's deadline has passed, its pending results count
 * as reported and its unplayed games are closed `0-0` (nobody scores), so the play-off or the
 * final can be created.
 *
 * The server sleeps when idle (Fly.io stops the machine), so no timer could be trusted to fire:
 * instead every page and action that reads or writes the week calls this first, and the rules
 * are applied late but with the time they fell due (`confirmedAt` = reported + 48 h). With nothing
 * due it costs one query: the open week's unconfirmed games (`games_week_idx`).
 */
export function sweep(now = new Date()) {
	const events: LeagueEvent[] = [];
	db.transaction((tx) => {
		const rows = tx
			.select({ game: games, deadline: weeks.deadline })
			.from(games)
			.innerJoin(weeks, eq(weeks.id, games.weekId))
			.where(and(isNull(weeks.closedAt), isNull(games.confirmedAt)))
			.all();

		const byWeek = new Map<number, { deadline: Date | null; games: GameRow[] }>();
		for (const { game, deadline } of rows) {
			const week = byWeek.get(game.weekId) ?? { deadline, games: [] };
			week.games.push(game);
			byWeek.set(game.weekId, week);
		}

		for (const [weekId, week] of byWeek) {
			const due = dueAt(week.games.map(timed), now.getTime(), ms(week.deadline));
			if (nothingDue(due)) continue;
			for (const { id, at, rule } of due.confirm) {
				tx.update(games)
					.set({ confirmedAt: new Date(at), autoConfirmed: true })
					.where(and(eq(games.id, id), isNull(games.confirmedAt)))
					.run();
				const g = week.games.find((x) => x.id === id)!;
				if (rule === 'clock' && g.result)
					events.push({ type: 'autoConfirmed', whiteId: g.whiteId, blackId: g.blackId, result: g.result });
			}
			for (const { id, at } of due.unplayed)
				tx.update(games)
					.set({ result: '0-0', reportedById: null, reportedAt: new Date(at), confirmedAt: new Date(at) })
					.where(and(eq(games.id, id), isNull(games.confirmedAt)))
					.run();
			advance(tx, weekId, events);
		}
	});
	notify(events);
}

/**
 * An admin moves the open week's deadline. Only during the group stage (the play-off and the
 * final have none), and never into the past.
 */
export function setDeadline(deadline: Date, now = new Date()) {
	if (Number.isNaN(deadline.getTime())) throw new LeagueError('league.badDeadline');
	if (deadline.getTime() <= now.getTime()) throw new LeagueError('league.deadlinePast');
	db.transaction((tx) => {
		const week = tx.select().from(weeks).where(isNull(weeks.closedAt)).get();
		if (!week) throw new LeagueError('league.noOpenWeek');
		const rows = weekGames(tx, week.id);
		if (nextStep(weekPlayerIds(rows), rows.map(toGame)).phase !== 'group')
			throw new LeagueError('league.groupOver');
		tx.update(weeks).set({ deadline }).where(eq(weeks.id, week.id)).run();
	});
}

/**
 * After a player leaves the league (archived or deleted, `active` already false, same
 * transaction): take them out of the open week, if they are in it. See `advance`. What that sets
 * off (a final, a King) lands in `events`, for the caller to `notify` once committed.
 */
export function leaveOpenWeek(tx: Tx, events: LeagueEvent[]) {
	const week = tx.select().from(weeks).where(isNull(weeks.closedAt)).get();
	if (week) advance(tx, week.id, events);
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
