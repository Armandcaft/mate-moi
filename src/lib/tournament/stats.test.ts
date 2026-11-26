import { describe, expect, it } from 'vitest';
import { chronological, playerStats, type StatGame } from './stats';
import type { Result } from './types';

const A = 1, B = 2, C = 3, D = 4;
let seq = 0;
/** A game at minute `at`, `a` with White: '+' a wins, '-' a loses, '=' draw, '0' 0-0. */
const game = (a: number, b: number, r: '+' | '-' | '=' | '0', at = ++seq): StatGame => ({
	id: at,
	whiteId: a,
	blackId: b,
	result: ({ '+': '1-0', '-': '0-1', '=': '1/2-1/2', '0': '0-0' } as Record<string, Result>)[r],
	confirmedAt: at * 60_000
});

describe('playerStats', () => {
	it('has nothing to say before a game', () => {
		expect(playerStats(A, [game(B, C, '+')])).toEqual({
			playerId: A, played: 0, streak: null, bestWinStreak: 0, winRate: null, nemesis: null, victim: null
		});
	});

	it('follows the current streak, broken by a draw, not by a 0-0', () => {
		const games = [game(A, B, '+'), game(A, C, '='), game(B, A, '-'), game(A, C, '0'), game(C, A, '-'), game(A, B, '+')];
		// After the draw: win, (0-0 skipped), win, win
		expect(playerStats(A, games).streak).toEqual({ outcome: 'win', n: 3 });
		expect(playerStats(B, games).streak).toEqual({ outcome: 'loss', n: 3 });
		expect(playerStats(C, games).streak).toEqual({ outcome: 'loss', n: 1 });
	});

	it('reads games chronologically, by confirmation then id', () => {
		const late = game(A, B, '-', 100);
		const early = game(A, B, '+', 1);
		expect(chronological([late, early]).map((g) => g.id)).toEqual([1, 100]);
		expect(playerStats(A, [late, early]).streak).toEqual({ outcome: 'loss', n: 1 });
	});

	it('keeps the best win streak ever', () => {
		const games = [game(A, B, '+'), game(A, B, '+'), game(A, B, '+'), game(A, B, '-'), game(A, B, '+')];
		expect(playerStats(A, games).bestWinStreak).toBe(3);
		expect(playerStats(B, games).bestWinStreak).toBe(1);
	});

	it('counts a 0-0 as played but not in the win rate', () => {
		const games = [game(A, B, '+'), game(A, B, '='), game(A, B, '-'), game(A, C, '0')];
		const s = playerStats(A, games);
		expect(s.played).toBe(4);
		expect(s.winRate).toBe(33);
		expect(playerStats(C, games)).toMatchObject({ played: 1, winRate: null, streak: null });
	});

	it('finds the bête noire and the tête de Turc, from 2 games on', () => {
		const games = [
			game(A, B, '-'), game(B, A, '+'), game(A, B, '='), // A vs B: 0-1-2
			game(A, C, '+'), game(C, A, '-'), game(A, C, '+'), // A vs C: 3-0-0
			game(A, D, '-') // A vs D: one game only
		];
		const s = playerStats(A, games);
		expect(s.nemesis).toEqual({ opponentId: B, w: 0, d: 1, l: 2 });
		expect(s.victim).toEqual({ opponentId: C, w: 3, d: 0, l: 0 });
	});

	it('has no bête noire when nobody has the better of them', () => {
		const games = [game(A, B, '+'), game(A, B, '-'), game(A, C, '+'), game(A, C, '+'), game(A, D, '-')];
		const s = playerStats(A, games);
		expect(s.nemesis).toBeNull(); // B is level, D only played once
		expect(s.victim).toMatchObject({ opponentId: C });
	});

	it('ignores 0-0 games for rivals', () => {
		const games = [game(A, B, '0'), game(A, B, '0'), game(A, B, '-')];
		expect(playerStats(A, games).nemesis).toBeNull();
	});
});
