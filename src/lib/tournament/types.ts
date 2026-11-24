/** A game's result, from White's point of view. */
export type Result = '1-0' | '0-1' | '1/2-1/2';

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
	gamesPerPair: number;
	win: number;
	draw: number;
	loss: number;
}

export const RULES: Rules = { gamesPerPair: 3, win: 3, draw: 1, loss: 0 };
