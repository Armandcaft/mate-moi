// The rules that depend on time. The server sleeps when idle (Fly.io), so nothing runs on a
// schedule: `sweep` (league.ts) asks these, with the current time, whenever a page is loaded.
import type { Result, Stage } from './types';

export const HOUR_MS = 3_600_000;
/** A reported result nobody confirmed or disputed counts after this long. */
export const AUTO_CONFIRM_MS = 48 * HOUR_MS;

/** What the clock needs to know about a game; times in milliseconds. */
export interface TimedGame {
	id: number;
	stage: Stage;
	/** As reported (or confirmed). */
	result: Result | null;
	reportedAt: number | null;
	confirmedAt: number | null;
}

/** When a reported, unconfirmed result will count on its own; `null` if nothing is pending. */
export function autoConfirmAt(game: TimedGame): number | null {
	if (game.confirmedAt !== null || game.result === null || game.reportedAt === null) return null;
	return game.reportedAt + AUTO_CONFIRM_MS;
}

export interface Due {
	/** Pending results that now count, as reported, confirmed at `at`. */
	confirm: { id: number; at: number }[];
}

/** What the clock has made due by `now` among `games`: empty when there is nothing to do. */
export function dueAt(games: TimedGame[], now: number): Due {
	const confirm: Due['confirm'] = [];
	for (const g of games) {
		const at = autoConfirmAt(g);
		if (at !== null && at <= now) confirm.push({ id: g.id, at });
	}
	return { confirm };
}

/** Whole hours left until `at`, rounded; 0 means less than an hour (and past is 0 too). */
export function hoursUntil(at: number, now: number): number {
	const left = at - now;
	return left < HOUR_MS ? 0 : Math.round(left / HOUR_MS);
}
