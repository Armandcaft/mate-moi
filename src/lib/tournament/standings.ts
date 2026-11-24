import type { Game, PlayerId, Rules } from './types';
import { RULES } from './types';

export interface Line {
	playerId: PlayerId;
	played: number;
	wins: number;
	draws: number;
	losses: number;
	points: number;
}

/** `1` if `playerId` won, `0.5` for a draw, `0` for a loss; `null` if they didn't play it or it has no result. */
export function scoreFor(game: Pick<Game, 'whiteId' | 'blackId' | 'result'>, playerId: PlayerId) {
	if (!game.result) return null;
	if (game.whiteId !== playerId && game.blackId !== playerId) return null;
	if (game.result === '1/2-1/2') return 0.5;
	const whiteWon = game.result === '1-0';
	return whiteWon === (game.whiteId === playerId) ? 1 : 0;
}

export function winnerOf(game: Pick<Game, 'whiteId' | 'blackId' | 'result'>): PlayerId | null {
	if (game.result === '1-0') return game.whiteId;
	if (game.result === '0-1') return game.blackId;
	return null;
}

/** One table line per player, from the finished games in `games` (callers pass the stage they mean). */
export function table(playerIds: PlayerId[], games: Game[], rules: Rules = RULES): Line[] {
	const lines = new Map<PlayerId, Line>(
		playerIds.map((id) => [id, { playerId: id, played: 0, wins: 0, draws: 0, losses: 0, points: 0 }])
	);
	for (const g of games) {
		for (const id of [g.whiteId, g.blackId]) {
			const line = lines.get(id);
			const s = scoreFor(g, id);
			if (!line || s === null) continue;
			line.played++;
			if (s === 1) {
				line.wins++;
				line.points += rules.win;
			} else if (s === 0.5) {
				line.draws++;
				line.points += rules.draw;
			} else {
				line.losses++;
				line.points += rules.loss;
			}
		}
	}
	return [...lines.values()];
}

/** Split `ids` into tiers by `key` (highest first); players with equal keys share a tier. */
function splitBy(ids: PlayerId[], key: (id: PlayerId) => number): PlayerId[][] {
	const sorted = [...ids].sort((a, b) => key(b) - key(a) || a - b);
	const tiers: PlayerId[][] = [];
	for (const id of sorted) {
		const last = tiers.at(-1);
		if (last && key(last[0]) === key(id)) last.push(id);
		else tiers.push([id]);
	}
	return tiers;
}

function among(games: Game[], ids: PlayerId[]) {
	const set = new Set(ids);
	return games.filter((g) => set.has(g.whiteId) && set.has(g.blackId));
}

/**
 * The ranking, as tiers of players who could not be separated (best first).
 *
 * Tie-breaks, applied in order to players level on group points:
 *   1. points in the group games between the tied players only (head-to-head),
 *   2. number of group wins,
 *   3. wins in the play-off games between the still-tied players.
 * Players still level after that share a tier; `nextStep` then schedules play-off games.
 */
export function rank(
	playerIds: PlayerId[],
	groupGames: Game[],
	playoffGames: Game[] = [],
	rules: Rules = RULES
): PlayerId[][] {
	const overall = new Map(table(playerIds, groupGames, rules).map((l) => [l.playerId, l]));

	const tieBreaks: ((tied: PlayerId[]) => (id: PlayerId) => number)[] = [
		(tied) => {
			const h2h = new Map(table(tied, among(groupGames, tied), rules).map((l) => [l.playerId, l.points]));
			return (id) => h2h.get(id)!;
		},
		() => (id) => overall.get(id)!.wins,
		(tied) => {
			const po = new Map(table(tied, among(playoffGames, tied), rules).map((l) => [l.playerId, l.wins]));
			return (id) => po.get(id)!;
		}
	];

	let tiers = splitBy(playerIds, (id) => overall.get(id)!.points);
	for (const tieBreak of tieBreaks) {
		tiers = tiers.flatMap((tier) => (tier.length > 1 ? splitBy(tier, tieBreak(tier)) : [tier]));
	}
	return tiers;
}
