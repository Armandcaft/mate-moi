import { pairs } from './schedule';
import { rank, winnerOf } from './standings';
import type { Game, NewGame, PlayerId, Rules } from './types';
import { RULES } from './types';

export type Step =
	/** Group games still to be played or confirmed. */
	| { phase: 'group'; create: [] }
	/** Players level for a place in the final play Armageddon games until one is ahead. */
	| { phase: 'playoff'; contenders: PlayerId[]; create: NewGame[] }
	/** The final (and its Armageddon decider if drawn). */
	| { phase: 'final'; finalists: [PlayerId, PlayerId]; create: NewGame[] }
	| { phase: 'done'; finalists: [PlayerId, PlayerId]; king: PlayerId; create: [] };

const done = (g: Game) => g.result !== null;

/**
 * Where the week stands, and which games (if any) must be created to move it on.
 *
 * Pure and idempotent: called after every confirmed result, it returns `create: []`
 * while games are still being played, and the next games once they are all finished.
 * `players` is in seed order only for display; ties are always settled by `rank`.
 */
export function nextStep(players: PlayerId[], games: Game[], rules: Rules = RULES): Step {
	const group = games.filter((g) => g.stage === 'group');
	if (!group.every(done)) return { phase: 'group', create: [] };

	const playoff = games.filter((g) => g.stage === 'playoff');
	const tiers = rank(players, group, playoff, rules);

	// Who is in the final? Only the tier straddling 2nd place can need a play-off:
	// two players level at the top both qualify, so they need none.
	let finalists: [PlayerId, PlayerId] | null = null;
	let contenders: PlayerId[] = [];
	if (tiers[0].length === 2) finalists = [tiers[0][0], tiers[0][1]];
	else if (tiers[0].length > 2) contenders = tiers[0];
	else if (tiers[1].length === 1) finalists = [tiers[0][0], tiers[1][0]];
	else contenders = tiers[1];

	if (!finalists) {
		if (!playoff.every(done)) return { phase: 'playoff', contenders, create: [] };
		const round = Math.max(0, ...playoff.map((g) => g.round)) + 1;
		const create: NewGame[] = pairs(contenders).map(([a, b], i) => {
			const aWhite = (round + i) % 2 === 1;
			return {
				stage: 'playoff',
				round,
				whiteId: aWhite ? a : b,
				blackId: aWhite ? b : a,
				armageddon: true
			};
		});
		return { phase: 'playoff', contenders, create };
	}

	// Seed 1 is the better-ranked finalist; equal finalists keep the ranking's stable order.
	const [seed1, seed2] = finalists;
	const finals = games.filter((g) => g.stage === 'final').sort((a, b) => a.round - b.round);
	const last = finals.at(-1);

	if (!last) {
		// The classical final: the top seed earns White.
		return {
			phase: 'final',
			finalists,
			create: [{ stage: 'final', round: 1, whiteId: seed1, blackId: seed2, armageddon: false }]
		};
	}
	if (!done(last)) return { phase: 'final', finalists, create: [] };

	const king = winnerOf(last);
	if (king !== null) return { phase: 'done', finalists, king, create: [] };

	// A drawn final goes to Armageddon; the top seed earns Black and its draw odds.
	return {
		phase: 'final',
		finalists,
		create: [
			{ stage: 'final', round: last.round + 1, whiteId: seed2, blackId: seed1, armageddon: true }
		]
	};
}
