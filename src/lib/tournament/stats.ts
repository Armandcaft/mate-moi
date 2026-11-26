// Per-player statistics for the Hall of Kings, from confirmed games of every stage.
import type { PlayerId, Result } from './types';

export interface StatGame {
	id: number;
	whiteId: PlayerId;
	blackId: PlayerId;
	result: Result;
	/** Milliseconds; games are taken in this order, then by id. */
	confirmedAt: number;
}

export type Outcome = 'win' | 'draw' | 'loss';

/** A record against someone: wins, draws, losses. */
export interface Record3 {
	w: number;
	d: number;
	l: number;
}

export interface PlayerStats {
	playerId: PlayerId;
	/** Every confirmed game, `0-0` included (it counts as played). */
	played: number;
	/** The run of identical outcomes the player is on now (`0-0` games skipped); none before a game. */
	streak: { outcome: Outcome; n: number } | null;
	/** The longest run of wins ever. */
	bestWinStreak: number;
	/** Wins / (wins + draws + losses), as a whole percentage, `0-0` excluded; none without a game. */
	winRate: number | null;
	/** The opponent with the worst record against them (at least 2 games), if any is negative. */
	nemesis: ({ opponentId: PlayerId } & Record3) | null;
	/** The opponent with the best record against them (at least 2 games), if any is positive. */
	victim: ({ opponentId: PlayerId } & Record3) | null;
}

/** Opponents faced fewer times than this are not a "bête noire" or a "tête de Turc" yet. */
export const MIN_GAMES_VS = 2;

export const chronological = <G extends Pick<StatGame, 'id' | 'confirmedAt'>>(games: G[]) =>
	[...games].sort((a, b) => a.confirmedAt - b.confirmedAt || a.id - b.id);

/** How `playerId` did in `game`; `null` if not theirs, or a `0-0` nobody played. */
export function outcomeFor(game: Pick<StatGame, 'whiteId' | 'blackId' | 'result'>, playerId: PlayerId): Outcome | null {
	if (game.whiteId !== playerId && game.blackId !== playerId) return null;
	if (game.result === '0-0') return null;
	if (game.result === '1/2-1/2') return 'draw';
	return (game.result === '1-0') === (game.whiteId === playerId) ? 'win' : 'loss';
}

/** `games` in any order; they are read chronologically. */
export function playerStats(playerId: PlayerId, games: StatGame[]): PlayerStats {
	const mine = chronological(games).filter((g) => g.whiteId === playerId || g.blackId === playerId);
	let streak = null as PlayerStats['streak'];
	let run = 0;
	let bestWinStreak = 0;
	const total: Record3 = { w: 0, d: 0, l: 0 };
	const vs = new Map<PlayerId, Record3>();

	for (const g of mine) {
		const o = outcomeFor(g, playerId);
		if (!o) continue; // a 0-0: neither breaks nor extends a streak
		streak = streak?.outcome === o ? { outcome: o, n: streak.n + 1 } : { outcome: o, n: 1 };
		run = o === 'win' ? run + 1 : 0;
		bestWinStreak = Math.max(bestWinStreak, run);
		const key = o === 'win' ? 'w' : o === 'draw' ? 'd' : 'l';
		total[key]++;
		const opponent = g.whiteId === playerId ? g.blackId : g.whiteId;
		const rec = vs.get(opponent) ?? { w: 0, d: 0, l: 0 };
		rec[key]++;
		vs.set(opponent, rec);
	}

	const decided = total.w + total.d + total.l;
	// Draws are half a point each way: the balance is wins minus losses.
	const rivals = [...vs]
		.filter(([, r]) => r.w + r.d + r.l >= MIN_GAMES_VS)
		.map(([opponentId, r]) => ({ opponentId, ...r, net: r.w - r.l, n: r.w + r.d + r.l }));
	const pick = (sign: 1 | -1) => {
		const best = rivals
			.filter((r) => sign * r.net > 0)
			.sort((a, b) => sign * (b.net - a.net) || b.n - a.n || a.opponentId - b.opponentId)[0];
		return best ? { opponentId: best.opponentId, w: best.w, d: best.d, l: best.l } : null;
	};

	return {
		playerId,
		played: mine.length,
		streak,
		bestWinStreak,
		winRate: decided ? Math.round((100 * total.w) / decided) : null,
		nemesis: pick(-1),
		victim: pick(1)
	};
}
