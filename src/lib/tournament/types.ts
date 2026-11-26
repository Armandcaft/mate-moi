/** A game's result, from White's point of view. */
export type Result = '1-0' | '0-1' | '1/2-1/2' | '0-0';
/**
 * `0-0`: a group game nobody played before the week's deadline, closed as a double forfeit.
 * Nobody scores: it counts as played and as a loss for both. Never reported by a player.
 */
export const REPORTABLE: readonly Result[] = ['1-0', '0-1', '1/2-1/2'];

/**
 * - `group`: the round-robin everyone plays.
 * - `playoff`: tie-break games for a place in the final (always Armageddon, so always decisive).
 * - `final`: the game for the crown, followed by an Armageddon game if it is drawn.
 */
export type Stage = 'group' | 'playoff' | 'final';

export type PlayerId = number;

export interface Game {
	stage: Stage;
	round: number;
	whiteId: PlayerId;
	blackId: PlayerId;
	/** Armageddon: a draw counts as a win for Black, so the result is never `1/2-1/2`. */
	armageddon: boolean;
	/** Only a CONFIRMED result goes here; a reported-but-unconfirmed game is still `null`. */
	result: Result | null;
}

export type NewGame = Omit<Game, 'result'>;

export interface Rules {
	win: number;
	draw: number;
	loss: number;
}

export const RULES: Rules = { win: 3, draw: 1, loss: 0 };

/**
 * Games against each opponent in a new week, so the week stays playable as the group grows:
 * 3 up to 4 players (9 games each), 2 for 5–6 (8–10 each), 1 from 7 (6 or more each).
 */
export function gamesPerPairFor(players: number): number {
	if (players <= 4) return 3;
	if (players <= 6) return 2;
	return 1;
}
