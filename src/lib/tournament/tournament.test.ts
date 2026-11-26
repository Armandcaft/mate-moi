import { describe, expect, it } from 'vitest';
import {
	HOUR_MS,
	nothingDue,
	autoConfirmAt,
	departures,
	dueAt,
	hoursUntil,
	type TimedGame,
	gamesPerPairFor,
	gamesPerPairIn,
	groupSchedule,
	joinerSchedule,
	nextStep,
	pairs, rank, table, type Game, type NewGame, type Result } from './index';

const A = 1, B = 2, C = 3;
const PLAYERS = [A, B, C];

/** Play every game of `games`, deciding each result with `decide`. */
function play(games: NewGame[], decide: (g: NewGame, i: number) => Result): Game[] {
	return games.map((g, i) => ({ ...g, result: decide(g, i) }));
}

/** A result in which `winner` beats whoever they face (or a draw with `null`). */
const beats = (g: NewGame, winner: number | null): Result =>
	winner === null ? '1/2-1/2' : g.whiteId === winner ? '1-0' : '0-1';

/** Group stage where each pair's three games are decided by `outcome(pair)`. */
function group(outcome: (a: number, b: number) => (number | null)[]): Game[] {
	const sched = groupSchedule(PLAYERS, 3, 1);
	return sched.map((g) => {
		const [a, b] = [g.whiteId, g.blackId].sort();
		const winner = outcome(a, b)[g.round - 1];
		return { ...g, result: beats(g, winner) };
	});
}

describe('groupSchedule', () => {
	it('gives 3 players 6 games each, 9 in all', () => {
		const games = groupSchedule(PLAYERS, 3, 1);
		expect(games).toHaveLength(9);
		for (const p of PLAYERS)
			expect(games.filter((g) => g.whiteId === p || g.blackId === p)).toHaveLength(6);
	});

	it('alternates colours within a pair, and flips the extra White each week', () => {
		const whitesFor = (week: number) =>
			groupSchedule([A, B], 3, week).filter((g) => g.whiteId === A).length;
		expect([whitesFor(1), whitesFor(2)].sort()).toEqual([1, 2]);
		const colours = groupSchedule([A, B], 3, 1).map((g) => g.whiteId);
		expect(colours[0]).not.toBe(colours[1]);
		expect(colours[1]).not.toBe(colours[2]);
	});

	it('balances White across a 3-player week', () => {
		const games = groupSchedule(PLAYERS, 3, 1);
		const whites = PLAYERS.map((p) => games.filter((g) => g.whiteId === p).length);
		expect(whites.reduce((s, n) => s + n)).toBe(9);
		for (const w of whites) expect(w).toBeGreaterThanOrEqual(2);
		for (const w of whites) expect(w).toBeLessThanOrEqual(4);
	});
});

describe('table', () => {
	it('scores 3 for a win, 1 for a draw, 0 for a loss', () => {
		const games = play(groupSchedule([A, B], 3, 1), (g, i) =>
			i === 0 ? beats(g, A) : i === 1 ? beats(g, null) : beats(g, B)
		);
		const [a, b] = table([A, B], games);
		expect(a).toMatchObject({ played: 3, wins: 1, draws: 1, losses: 1, points: 4 });
		expect(b).toMatchObject({ played: 3, wins: 1, draws: 1, losses: 1, points: 4 });
	});

	it('ignores games without a confirmed result', () => {
		const games: Game[] = groupSchedule([A, B], 3, 1).map((g) => ({ ...g, result: null }));
		expect(table([A, B], games)[0].played).toBe(0);
	});
});

describe('rank', () => {
	it('orders by points', () => {
		// A beats everyone, B beats C.
		const games = group((a, b) => [a === A ? A : B, a === A ? A : B, a === A ? A : B]);
		expect(rank(PLAYERS, games)).toEqual([[A], [B], [C]]);
	});

	it('breaks a points tie on head-to-head', () => {
		// A vs B: A 2 wins + 1 loss (6-3). A vs C: all draws. B vs C: B wins all.
		// A = 6+3 = 9, B = 3+9 = 12, C = 3. To get a tie, adjust: B vs C 2 wins 1 loss.
		// A = 9, B = 3+6 = 9, C = 3+3 = 6. A leads B head-to-head 6-3.
		const games = group((a, b) =>
			a === A && b === B ? [A, A, B] : a === A ? [null, null, null] : [B, B, C]
		);
		expect(rank(PLAYERS, games)).toEqual([[A], [B], [C]]);
	});

	it('falls back to the number of wins when head-to-head is level', () => {
		// A vs B: 1 win each + draw. A vs C: A 1 win 2 losses (3). B vs C: 3 draws (3).
		// A: 4 + 3 = 7 (2 wins). B: 4 + 3 = 7 (1 win). C: 6 + 3 = 9.
		const games = group((a, b) =>
			a === A && b === B ? [A, B, null] : a === A ? [A, C, C] : [null, null, null]
		);
		expect(rank(PLAYERS, games)).toEqual([[C], [A], [B]]);
	});

	it('leaves a perfect three-way tie unresolved', () => {
		// Each pair: one win each and a draw.
		const games = group((a, b) => [a, b, null]);
		expect(rank(PLAYERS, games)).toEqual([[A, B, C]]);
	});
});

describe('nextStep', () => {
	const cycle = group((a, b) => [a, b, null]); // everyone on 12 points, nothing separates them

	it('waits while group games are unfinished', () => {
		const games = cycle.map((g, i) => (i === 0 ? { ...g, result: null } : g));
		expect(nextStep(PLAYERS, games)).toEqual({ phase: 'group', create: [] });
	});

	it('sends the top two straight to the final, top seed with White', () => {
		const games = group((a) => [a, a, a]); // lower id always wins: A 18, B 9, C 0
		const step = nextStep(PLAYERS, games);
		expect(step).toMatchObject({ phase: 'final', finalists: [A, B] });
		expect(step.create).toEqual([
			{ stage: 'final', round: 1, whiteId: A, blackId: B, armageddon: false }
		]);
	});

	it('needs no play-off when two players are level at the top', () => {
		// A and B draw everything together and both beat C 3-0.
		const games = group((a, b) => (b === C ? [a, a, a] : [null, null, null]));
		expect(nextStep(PLAYERS, games)).toMatchObject({ phase: 'final', finalists: [A, B] });
	});

	it('schedules an Armageddon play-off for a tie on 2nd place', () => {
		// A beats both; B and C split their games evenly.
		const games = group((a, b) => (a === A ? [A, A, A] : [B, C, null]));
		const step = nextStep(PLAYERS, games);
		expect(step).toMatchObject({ phase: 'playoff', contenders: [B, C] });
		expect(step.create).toHaveLength(1);
		expect(step.create[0]).toMatchObject({ stage: 'playoff', round: 1, armageddon: true });
	});

	it('plays round after round of a three-way play-off until it resolves', () => {
		const r1 = nextStep(PLAYERS, cycle);
		expect(r1).toMatchObject({ phase: 'playoff', contenders: [A, B, C] });
		expect(r1.create).toHaveLength(3);

		// Round 1 is another cycle: one win each.
		const winners = new Map([[`${A}-${B}`, A], [`${B}-${C}`, B], [`${A}-${C}`, C]]);
		const round1 = play(r1.create, (g) => {
			const key = [g.whiteId, g.blackId].sort().join('-');
			return beats(g, winners.get(key)!);
		});
		const r2 = nextStep(PLAYERS, [...cycle, ...round1]);
		expect(r2).toMatchObject({ phase: 'playoff', contenders: [A, B, C] });
		expect(r2.create.every((g) => g.round === 2)).toBe(true);

		// Round 2: A wins everything, B beats C.
		const round2 = play(r2.create, (g) =>
			beats(g, g.whiteId === A || g.blackId === A ? A : B)
		);
		expect(nextStep(PLAYERS, [...cycle, ...round1, ...round2])).toMatchObject({
			phase: 'final',
			finalists: [A, B]
		});
	});

	it('crowns the winner of the final', () => {
		const games = group((a) => [a, a, a]);
		const [final] = nextStep(PLAYERS, games).create;
		const step = nextStep(PLAYERS, [...games, { ...final, result: beats(final, B) }]);
		expect(step).toEqual({ phase: 'done', finalists: [A, B], king: B, create: [] });
	});

	it('sends a drawn final to Armageddon, top seed with Black', () => {
		const games = group((a) => [a, a, a]);
		const [final] = nextStep(PLAYERS, games).create;
		const drawn = { ...final, result: '1/2-1/2' as const };
		const step = nextStep(PLAYERS, [...games, drawn]);
		expect(step.create).toEqual([
			{ stage: 'final', round: 2, whiteId: B, blackId: A, armageddon: true }
		]);

		const decider = { ...step.create[0], result: '0-1' as const }; // a "draw" reported as Black's win
		expect(nextStep(PLAYERS, [...games, drawn, decider])).toMatchObject({ phase: 'done', king: A });
	});
});

describe('joinerSchedule', () => {
	const D = 4;

	it('gives the newcomer 3 games against each player already in the week', () => {
		const games = joinerSchedule(PLAYERS, D, 3, 1);
		expect(games).toHaveLength(9);
		expect(games.every((g) => g.whiteId === D || g.blackId === D)).toBe(true);
		for (const p of PLAYERS)
			expect(games.filter((g) => g.whiteId === p || g.blackId === p)).toHaveLength(3);
	});

	it('alternates colours within each new pairing', () => {
		const vsA = joinerSchedule(PLAYERS, D, 3, 1).filter((g) => g.whiteId === A || g.blackId === A);
		expect(vsA[0].whiteId).not.toBe(vsA[1].whiteId);
		expect(vsA[1].whiteId).not.toBe(vsA[2].whiteId);
	});

	it('makes the week a full round-robin again: every pair plays 3 games', () => {
		const week = [...groupSchedule(PLAYERS, 3, 1), ...joinerSchedule(PLAYERS, D, 3, 1)];
		for (const [a, b] of pairs([A, B, C, D])) {
			const between = week.filter((g) => [g.whiteId, g.blackId].sort().join() === [a, b].sort().join());
			expect(between).toHaveLength(3);
		}
	});

	it('keeps the week in the group stage until the newcomer’s games are played too', () => {
		const played = group((a) => [a, a, a]); // the original 9, all finished
		const joined: Game[] = joinerSchedule(PLAYERS, D, 3, 1).map((g) => ({ ...g, result: null }));
		expect(nextStep([A, B, C, D], [...played, ...joined])).toEqual({ phase: 'group', create: [] });

		const done = joined.map((g) => ({ ...g, result: beats(g, D) }));
		const step = nextStep([A, B, C, D], [...played, ...done]);
		expect(step).toMatchObject({ phase: 'final', finalists: [D, A] }); // D 27 points, A 18
	});
});

describe('games per opponent', () => {
	it.each([
		[2, 3], [3, 3], [4, 3], [5, 2], [6, 2], [7, 1], [10, 1]
	])('%i players → %i games against each opponent', (n, g) => {
		expect(gamesPerPairFor(n)).toBe(g);
	});

	it('keeps each player’s week between 6 and 10 games up to 7 players', () => {
		for (let n = 3; n <= 7; n++) {
			const each = (n - 1) * gamesPerPairFor(n);
			expect(each).toBeGreaterThanOrEqual(6);
			expect(each).toBeLessThanOrEqual(10);
		}
	});

	it('reads a scheduled week’s count back from its games', () => {
		const five = [1, 2, 3, 4, 5];
		expect(gamesPerPairIn(groupSchedule(five, 2, 1))).toBe(2);
		expect(gamesPerPairIn(groupSchedule(PLAYERS, 3, 1))).toBe(3);
		expect(gamesPerPairIn([])).toBe(0);
	});

	it('a 2-game week gives each player one White per opponent', () => {
		const games = groupSchedule([1, 2, 3, 4, 5], 2, 1);
		for (const [a, b] of pairs([1, 2, 3, 4, 5])) {
			const between = games.filter((g) => [g.whiteId, g.blackId].sort().join() === [a, b].sort().join());
			expect(between.map((g) => g.whiteId).sort()).toEqual([a, b].sort());
		}
	});

	it('a joiner plays the week’s own count, not the new group size’s', () => {
		// A 4-player week (3 each) that a 5th player joins: still 3 each, never 2.
		const week = groupSchedule([1, 2, 3, 4], 3, 1);
		const joined = joinerSchedule([1, 2, 3, 4], 5, gamesPerPairIn(week), 1);
		const all = [...week, ...joined];
		for (const [a, b] of pairs([1, 2, 3, 4, 5]))
			expect(all.filter((g) => [g.whiteId, g.blackId].sort().join() === [a, b].sort().join())).toHaveLength(3);
	});
});

describe('nextStep with fewer than two players', () => {
	it('calls the week off: no king', () => {
		expect(nextStep([], [])).toEqual({ phase: 'abandoned', create: [] });
		expect(nextStep([A], [])).toEqual({ phase: 'abandoned', create: [] });
	});
});

describe('departures (a player leaves mid-week)', () => {
	/**
	 * What `league.ts` does: settle the leavers, else create the next games, until nothing changes.
	 * Returns the week's games and its last step.
	 */
	function settle(players: number[], start: Game[], gone: Set<number>) {
		let games = start;
		let ids = players;
		for (let pass = 0; pass < 50; pass++) {
			const { drop, forfeit } = departures(ids, games, gone);
			if (drop.length) {
				games = games.filter((_, i) => !drop.includes(i));
				ids = ids.filter((id) => games.some((g) => g.stage === 'group' && (g.whiteId === id || g.blackId === id)));
				continue;
			}
			if (forfeit.length) {
				games = games.map((g, i) => {
					const f = forfeit.find((x) => x.index === i);
					return f ? { ...g, result: f.result } : g;
				});
				continue;
			}
			const step = nextStep(ids, games);
			if (step.create.length) {
				games = [...games, ...step.create.map((g) => ({ ...g, result: null }))];
				continue;
			}
			return { games, step, ids };
		}
		throw new Error('did not settle');
	}

	const D = 4;
	const FOUR = [A, B, C, D];

	it('leaves the week alone when the player is not in it', () => {
		const games = groupSchedule(PLAYERS, 3, 1).map((g) => ({ ...g, result: null }));
		expect(departures(PLAYERS, games, new Set([D]))).toEqual({ drop: [], forfeit: [] });
	});

	it('drops every group game of theirs, played or not, during the group stage', () => {
		const sched = groupSchedule(FOUR, 3, 1);
		const games: Game[] = sched.map((g, i) => ({ ...g, result: i < 5 ? beats(g, Math.min(g.whiteId, g.blackId)) : null }));
		const { drop, forfeit } = departures(FOUR, games, new Set([C]));
		expect(forfeit).toEqual([]);
		expect(drop.map((i) => games[i]).every((g) => g.whiteId === C || g.blackId === C)).toBe(true);
		expect(drop).toHaveLength(9); // 3 opponents × 3 games
		const left = games.filter((_, i) => !drop.includes(i));
		// Still an even round-robin among the three others: 3 games per pair.
		for (const [a, b] of pairs([A, B, D]))
			expect(left.filter((g) => [g.whiteId, g.blackId].sort().join() === [a, b].sort().join())).toHaveLength(3);
	});

	it('moves on to the final when dropping their games completes the group stage', () => {
		// Everything is played except C's games: once C leaves, the group stage is over.
		const games: Game[] = groupSchedule(FOUR, 3, 1).map((g) =>
			g.whiteId === C || g.blackId === C ? { ...g, result: null } : { ...g, result: beats(g, Math.min(g.whiteId, g.blackId)) }
		);
		const { step } = settle(FOUR, games, new Set([C]));
		expect(step).toMatchObject({ phase: 'final', finalists: [A, B] });
	});

	it('forfeits the final for a finalist who leaves, and crowns the opponent', () => {
		const games = group((a) => [a, a, a]); // A and B in the final
		const withFinal = [...games, ...nextStep(PLAYERS, games).create.map((g) => ({ ...g, result: null }))];
		const plan = departures(PLAYERS, withFinal, new Set([A]));
		expect(plan.drop).toEqual([]);
		expect(plan.forfeit).toEqual([{ index: withFinal.length - 1, result: '0-1' }]); // A had White
		expect(settle(PLAYERS, withFinal, new Set([A])).step).toMatchObject({ phase: 'done', king: B });
	});

	it('forfeits their play-off games, and the final made for them later', () => {
		// A beats both; B and C level for 2nd → a B–C play-off. C leaves: B wins it, then the final
		// A–B is played normally. Now let A (top seed, not in the play-off) leave instead: nothing
		// to forfeit yet, but the final created for A afterwards is forfeited at once.
		const games = group((a, b) => (a === A ? [A, A, A] : [B, C, null]));
		const playoff = nextStep(PLAYERS, games).create.map((g) => ({ ...g, result: null }));
		const week = [...games, ...playoff];

		const cLeaves = settle(PLAYERS, week, new Set([C]));
		expect(cLeaves.step).toMatchObject({ phase: 'final', finalists: [A, B] });

		expect(departures(PLAYERS, week, new Set([A]))).toEqual({ drop: [], forfeit: [] });
		// B beats C in the play-off; the final A–B is created, and A forfeits it.
		const played = week.map((g) => (g.stage === 'playoff' ? { ...g, result: beats(g, B) } : g));
		expect(settle(PLAYERS, played, new Set([A])).step).toMatchObject({ phase: 'done', king: B });
	});

	it('calls the week off when fewer than two players are left', () => {
		const games: Game[] = groupSchedule([A, B], 3, 1).map((g) => ({ ...g, result: null }));
		const { step, games: left } = settle([A, B], games, new Set([A]));
		expect(left).toEqual([]);
		expect(step).toEqual({ phase: 'abandoned', create: [] });
	});

	it('ignores a finished week', () => {
		const games = group((a) => [a, a, a]);
		const [final] = nextStep(PLAYERS, games).create;
		const done = [...games, { ...final, result: beats(final, A) }];
		expect(departures(PLAYERS, done, new Set([A]))).toEqual({ drop: [], forfeit: [] });
	});
});

describe('the clock: auto-confirm after 48 h', () => {
	const H = HOUR_MS;
	const t0 = Date.UTC(2026, 10, 23, 12);
	const pending = (id: number, reportedAt: number | null, result: Result | null = '1-0'): TimedGame => ({
		id,
		stage: 'group',
		result,
		reportedAt,
		confirmedAt: null
	});

	it('confirms a result nobody answered for 48 h, as of the 48th hour', () => {
		expect(dueAt([pending(1, t0)], t0 + 48 * H)).toEqual({ confirm: [{ id: 1, at: t0 + 48 * H, rule: 'clock' }], unplayed: [] });
		expect(dueAt([pending(1, t0)], t0 + 72 * H).confirm[0].at).toBe(t0 + 48 * H);
	});

	it('waits at 47 h', () => {
		expect(dueAt([pending(1, t0)], t0 + 47 * H)).toEqual({ confirm: [], unplayed: [] });
		expect(dueAt([pending(1, t0)], t0 + 48 * H - 1)).toEqual({ confirm: [], unplayed: [] });
	});

	it('ignores unreported and already confirmed games', () => {
		const confirmed = { ...pending(2, t0), confirmedAt: t0 + H };
		expect(dueAt([pending(1, null, null), confirmed], t0 + 100 * H)).toEqual({ confirm: [], unplayed: [] });
		expect(autoConfirmAt(confirmed)).toBeNull();
		expect(autoConfirmAt(pending(1, null, null))).toBeNull();
	});

	it('counts the hours left, rounded, 0 under an hour', () => {
		const at = t0 + 48 * H;
		expect(hoursUntil(at, t0 + 17 * H)).toBe(31);
		expect(hoursUntil(at, t0 + 17 * H + 20 * 60_000)).toBe(31); // 30 h 40 → 31
		expect(hoursUntil(at, t0 + 47 * H - 60_000)).toBe(1);
		expect(hoursUntil(at, t0 + 47 * H + 60_000)).toBe(0);
		expect(hoursUntil(at, t0 + 50 * H)).toBe(0);
	});
});

describe('the deadline', () => {
	const H = HOUR_MS;
	const t0 = Date.UTC(2026, 10, 23, 12);
	const deadline = t0 + 100 * H;
	const game = (id: number, extra: Partial<TimedGame> = {}): TimedGame => ({
		id,
		stage: 'group',
		result: null,
		reportedAt: null,
		confirmedAt: null,
		...extra
	});
	const week = [
		game(1, { result: '1-0', reportedAt: deadline - 10 * H }), // pending, not 48 h old
		game(2), // never reported
		game(3, { result: '0-1', reportedAt: t0, confirmedAt: t0 + H }), // done
		game(4, { result: '1-0', reportedAt: t0 }) // pending for over 48 h before the deadline
	];

	it('does nothing before it', () => {
		const due = dueAt(week, deadline - 1, deadline);
		expect(due.unplayed).toEqual([]);
		expect(due.confirm).toEqual([{ id: 4, at: t0 + 48 * H, rule: 'clock' }]);
	});

	it('confirms pending results as reported, then closes the unplayed games 0-0', () => {
		const due = dueAt(week, deadline + H, deadline);
		expect(due.confirm).toEqual([
			{ id: 1, at: deadline, rule: 'deadline' },
			{ id: 4, at: t0 + 48 * H, rule: 'clock' }
		]);
		expect(due.unplayed).toEqual([{ id: 2, at: deadline }]);
	});

	it('leaves the play-off and the final alone', () => {
		const ko = [game(5, { stage: 'final' }), game(6, { stage: 'playoff', result: '1-0', reportedAt: deadline })];
		expect(nothingDue(dueAt(ko, deadline + 10 * H, deadline))).toBe(true);
	});

	it('brings the countdown forward to the deadline', () => {
		expect(autoConfirmAt(week[0], deadline)).toBe(deadline);
		expect(autoConfirmAt(week[3], deadline)).toBe(t0 + 48 * H);
		expect(autoConfirmAt({ ...week[0], stage: 'final' }, deadline)).toBe(deadline + 38 * H);
	});
});

describe('0-0: a group game not played by the deadline', () => {
	const sched = groupSchedule(PLAYERS, 3, 1);

	it('counts as played and lost by both, for no points', () => {
		const games: Game[] = sched.map((g) => ({ ...g, result: '0-0' }));
		for (const line of table(PLAYERS, games))
			expect(line).toMatchObject({ played: 6, wins: 0, draws: 0, losses: 6, points: 0 });
	});

	it('scores nothing in the standings beside real results', () => {
		// A beats everyone; B–C never played.
		const games: Game[] = sched.map((g) =>
			g.whiteId === A || g.blackId === A ? { ...g, result: beats(g, A) } : { ...g, result: '0-0' }
		);
		const lines = new Map(table(PLAYERS, games).map((l) => [l.playerId, l]));
		expect(lines.get(A)).toMatchObject({ played: 6, wins: 6, points: 18 });
		expect(lines.get(B)).toMatchObject({ played: 6, wins: 0, losses: 6, points: 0 });
		expect(lines.get(C)).toMatchObject({ played: 6, wins: 0, losses: 6, points: 0 });
	});

	it('counts as 0 each in head-to-head between tied players', () => {
		// A beats everyone. B and C each lost all to A; between them: one win each and one 0-0.
		// B and C tie on 3 points, on head-to-head (3-3), and on wins (1-1): a play-off follows.
		let bc = 0;
		const games: Game[] = sched.map((g) => {
			if (g.whiteId === A || g.blackId === A) return { ...g, result: beats(g, A) };
			bc++;
			return { ...g, result: bc === 1 ? beats(g, B) : bc === 2 ? beats(g, C) : '0-0' };
		});
		expect(rank(PLAYERS, games)).toEqual([[A], [B, C]]);
		expect(nextStep(PLAYERS, games)).toMatchObject({ phase: 'playoff', contenders: [B, C] });
	});

	it('finishes the group stage like any result', () => {
		const games: Game[] = sched.map((g) => ({ ...g, result: '0-0' }));
		// Nobody scored: all three level, an Armageddon play-off among them.
		expect(nextStep(PLAYERS, games)).toMatchObject({ phase: 'playoff', contenders: [A, B, C] });
	});
});
