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

/**
 * When a reported, unconfirmed result will count on its own: 48 h after it was reported, or at
 * the week's `deadline` if that comes first (group games only). `null` if nothing is pending.
 */
export function autoConfirmAt(game: TimedGame, deadline: number | null = null): number | null {
	if (game.confirmedAt !== null || game.result === null || game.reportedAt === null) return null;
	const clock = game.reportedAt + AUTO_CONFIRM_MS;
	return game.stage === 'group' && deadline !== null ? Math.min(clock, deadline) : clock;
}

export interface Due {
	/**
	 * Pending results that now count, as reported, confirmed at `at`: by the 48 h rule (`clock`),
	 * or because the group stage's deadline passed first (`deadline`).
	 */
	confirm: { id: number; at: number; rule: 'clock' | 'deadline' }[];
	/** Group games nobody reported by the deadline: closed `0-0` at `at` (the deadline). */
	unplayed: { id: number; at: number }[];
}

/**
 * What the clock has made due by `now` among one week's `games`, given its group-stage `deadline`
 * (none: `null`): empty when there is nothing to do.
 */
export function dueAt(games: TimedGame[], now: number, deadline: number | null = null): Due {
	const due: Due = { confirm: [], unplayed: [] };
	const passed = deadline !== null && deadline <= now;
	for (const g of games) {
		if (g.confirmedAt !== null) continue;
		const clock = autoConfirmAt(g);
		if (clock !== null && clock <= now && (!passed || g.stage !== 'group' || clock <= deadline!))
			due.confirm.push({ id: g.id, at: clock, rule: 'clock' });
		else if (passed && g.stage === 'group') {
			if (g.result !== null) due.confirm.push({ id: g.id, at: deadline!, rule: 'deadline' });
			else due.unplayed.push({ id: g.id, at: deadline! });
		}
	}
	return due;
}

/** True when `due` asks for nothing. */
export const nothingDue = (due: Due) => !due.confirm.length && !due.unplayed.length;

/** A new week's deadline: seven days after it starts. */
export const WEEK_MS = 7 * 24 * HOUR_MS;

/** Whole hours left until `at`, rounded; 0 means less than an hour (and past is 0 too). */
export function hoursUntil(at: number, now: number): number {
	const left = at - now;
	return left < HOUR_MS ? 0 : Math.round(left / HOUR_MS);
}
