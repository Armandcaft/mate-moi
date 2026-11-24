import type { Cookies } from '@sveltejs/kit';
import { and, eq, gt } from 'drizzle-orm';
import { createHash, randomBytes } from 'node:crypto';
import { db, players, sessions, type Player } from './db';

export const SESSION_COOKIE = 'mm_session';
const SESSION_DAYS = 180;

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

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
		.where(and(eq(sessions.id, sha256(token)), gt(sessions.expiresAt, new Date())))
		.get();
	return row?.player ?? null;
}

export function destroySession(cookies: Cookies) {
	const token = cookies.get(SESSION_COOKIE);
	if (token) db.delete(sessions).where(eq(sessions.id, sha256(token))).run();
	cookies.delete(SESSION_COOKIE, { path: '/' });
}

// ── Login throttling ────────────────────────────────────────────────────────────
// In memory on purpose: one server, and a restart forgiving a few failed PINs is harmless.

const MAX_FAILURES = 5;
const LOCK_MS = 15 * 60_000;
const failures = new Map<number, { count: number; lockedUntil: number }>();

/** Milliseconds until `playerId` may try again, or 0. */
export function lockedFor(playerId: number): number {
	const f = failures.get(playerId);
	return f ? Math.max(0, f.lockedUntil - Date.now()) : 0;
}

export function recordFailure(playerId: number) {
	const f = failures.get(playerId) ?? { count: 0, lockedUntil: 0 };
	f.count++;
	if (f.count >= MAX_FAILURES) {
		f.count = 0;
		f.lockedUntil = Date.now() + LOCK_MS;
	}
	failures.set(playerId, f);
}

export function clearFailures(playerId: number) {
	failures.delete(playerId);
}
