import type { NewGame, PlayerId } from './types';

/** Every unordered pair of players, in a stable order. */
export function pairs(playerIds: PlayerId[]): [PlayerId, PlayerId][] {
	const ids = [...playerIds].sort((a, b) => a - b);
	const out: [PlayerId, PlayerId][] = [];
	for (let i = 0; i < ids.length; i++)
		for (let j = i + 1; j < ids.length; j++) out.push([ids[i], ids[j]]);
	return out;
}

/**
 * The group stage: every pair plays `gamesPerPair` games, colours alternating.
 *
 * With an odd number of games one player of each pair gets White once more. `weekNumber`
 * flips who that is from one week to the next, so it evens out over the season.
 * Games are ordered by round (round 1 = everyone's first game), which is also the
 * suggested playing order.
 */
export function groupSchedule(
	playerIds: PlayerId[],
	gamesPerPair: number,
	weekNumber: number
): NewGame[] {
	const ps = pairs(playerIds);
	const games: NewGame[] = [];
	for (let round = 1; round <= gamesPerPair; round++) {
		ps.forEach(([a, b], pairIndex) => {
			const aWhite = (round + weekNumber + pairIndex) % 2 === 0;
			games.push({
				stage: 'group',
				round,
				whiteId: aWhite ? a : b,
				blackId: aWhite ? b : a,
				armageddon: false
			});
		});
	}
	return games;
}
