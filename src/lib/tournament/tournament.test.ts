import { describe, expect, it } from 'vitest';
import { groupSchedule, nextStep, rank, table, type Game, type NewGame, type Result } from './index';

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
