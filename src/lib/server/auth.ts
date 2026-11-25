import type { Cookies } from '@sveltejs/kit';
import { and, eq, gt, ne } from 'drizzle-orm';
import { createHash, randomBytes } from 'node:crypto';
import type { Problem } from '../i18n/index.ts';
import { db, players, sessions, type Player } from './db';

export const SESSION_COOKIE = 'mm_session';
const SESSION_DAYS = 180;

export const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

export function createSession(cookies: Cookies, playerId: number, secure: boolean) {
	const token = randomBytes(32).toString('base64url');
	const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
	db.insert(sessions).values({ id: sha256(token), playerId, expiresAt }).run();
	cookies.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure,
		expires: expiresAt
	});
}

export function playerFromSession(token: string | undefined): Player | null {
	if (!token) return null;
	const row = db
		.select({ player: players })
		.from(sessions)
		.innerJoin(players, eq(players.id, sessions.playerId))
		.where(
			and(
				eq(sessions.id, sha256(token)),
				gt(sessions.expiresAt, new Date()),
				// A deactivated player is signed out everywhere at once.
				eq(players.active, true)
			)
		)
		.get();
	return row?.player ?? null;
}

export function destroySession(cookies: Cookies) {
	const token = cookies.get(SESSION_COOKIE);
	if (token) db.delete(sessions).where(eq(sessions.id, sha256(token))).run();
	cookies.delete(SESSION_COOKIE, { path: '/' });
}

// ── Login throttling ────────────────────────────────────────────────────────────
// Kept on the player row: Fly.io stops the machine when idle, which would wipe an
// in-memory counter and hand a guesser five fresh tries after every restart.

const MAX_FAILURES = 5;
const LOCK_MS = 15 * 60_000;

/** Milliseconds until `player` may try a code again, or 0. */
export function lockedFor(player: Pick<Player, 'lockedUntil'>): number {
	return player.lockedUntil ? Math.max(0, player.lockedUntil.getTime() - Date.now()) : 0;
}

/** Count a wrong code; the fifth in a row locks the player out. Returns the lock in ms, or 0. */
export function recordFailure(playerId: number): number {
	return db.transaction((tx) => {
		const p = tx.select({ n: players.failedLogins }).from(players).where(eq(players.id, playerId)).get();
		const n = (p?.n ?? 0) + 1;
		const lock = n >= MAX_FAILURES;
		tx.update(players)
			.set(lock ? { failedLogins: 0, lockedUntil: new Date(Date.now() + LOCK_MS) } : { failedLogins: n })
			.where(eq(players.id, playerId))
			.run();
		return lock ? LOCK_MS : 0;
	});
}

export function clearFailures(playerId: number) {
	db.update(players).set({ failedLogins: 0, lockedUntil: null }).where(eq(players.id, playerId)).run();
}

export const lockMessage = (ms: number): Problem => ({ key: 'login.locked', params: { min: Math.ceil(ms / 60_000) } });

// ── Changing one's own code ─────────────────────────────────────────────────────

/** Store a new code, and sign the player out everywhere except this browser. */
export function setOwnPin(cookies: Cookies, playerId: number, pinHash: string) {
	const token = cookies.get(SESSION_COOKIE);
	const keep = token ? sha256(token) : '';
	db.transaction((tx) => {
		tx.update(players)
			.set({ pinHash, mustChangePin: false, failedLogins: 0, lockedUntil: null })
			.where(eq(players.id, playerId))
			.run();
		tx.delete(sessions)
			.where(and(eq(sessions.playerId, playerId), ne(sessions.id, keep)))
			.run();
	});
}
