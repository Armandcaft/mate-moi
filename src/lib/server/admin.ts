// Invites, the admin's player management, and backups.
import { and, asc, desc, eq, gt, isNull, ne, sql } from 'drizzle-orm';
import { randomBytes, randomInt } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { sha256 } from './auth.ts';
import { db, invites, players, sessions, sqlite, type Player } from './db/index.ts';
import { hashPin, newPinProblem } from './pin.ts';

export class AdminError extends Error {}

const INVITE_HOURS = 48;

// ── Invites ─────────────────────────────────────────────────────────────────────

/** A new one-time invite. Returns the token for the link; only its hash is stored. */
export function createInvite(byId: number): { token: string; expiresAt: Date } {
	const token = randomBytes(24).toString('base64url');
	const expiresAt = new Date(Date.now() + INVITE_HOURS * 3_600_000);
	db.insert(invites).values({ id: sha256(token), createdById: byId, expiresAt }).run();
	return { token, expiresAt };
}

/** Invites still waiting to be used, newest first. */
export function pendingInvites() {
	return db
		.select({ id: invites.id, expiresAt: invites.expiresAt, createdAt: invites.createdAt, by: players.name })
		.from(invites)
		.innerJoin(players, eq(players.id, invites.createdById))
		.where(and(isNull(invites.usedAt), gt(invites.expiresAt, new Date())))
		.orderBy(desc(invites.createdAt))
		.all();
}

export function revokeInvite(id: string) {
	db.delete(invites).where(and(eq(invites.id, id), isNull(invites.usedAt))).run();
}

/** True if `token` is an invite that can still be used. */
export function inviteIsValid(token: string): boolean {
	return !!db
		.select({ id: invites.id })
		.from(invites)
		.where(and(eq(invites.id, sha256(token)), isNull(invites.usedAt), gt(invites.expiresAt, new Date())))
		.get();
}

export const NAME_PATTERN = /^[\p{L}][\p{L}\p{M}' .-]{1,23}$/u;

/** The newcomer creates their player with their own code; the invite is spent. Returns their id. */
export function acceptInvite(token: string, rawName: string, pin: string): number {
	const name = rawName.trim().replace(/\s+/g, ' ');
	if (!NAME_PATTERN.test(name)) throw new AdminError('Ton nom : 2 à 24 lettres.');
	const problem = newPinProblem(pin);
	if (problem) throw new AdminError(problem);

	return db.transaction((tx) => {
		const invite = tx
			.select()
			.from(invites)
			.where(and(eq(invites.id, sha256(token)), isNull(invites.usedAt), gt(invites.expiresAt, new Date())))
			.get();
		if (!invite) throw new AdminError('Cette invitation a expiré ou a déjà servi.');

		const taken = tx
			.select({ id: players.id })
			.from(players)
			.where(sql`lower(${players.name}) = lower(${name})`)
			.get();
		if (taken) throw new AdminError('Ce nom est déjà pris. Ajoute une initiale ?');

		// Their own code from the start: nothing temporary to replace.
		const player = tx
			.insert(players)
			.values({ name, pinHash: hashPin(pin), mustChangePin: false })
			.returning({ id: players.id })
			.get();
		tx.update(invites)
			.set({ usedAt: new Date(), usedById: player.id })
			.where(eq(invites.id, invite.id))
			.run();
		return player.id;
	});
}

// ── Players ─────────────────────────────────────────────────────────────────────

export type PlayerSummary = Pick<
	Player,
	'id' | 'name' | 'active' | 'isAdmin' | 'mustChangePin' | 'lockedUntil'
>;

export function allPlayers(): PlayerSummary[] {
	return db
		.select({
			id: players.id,
			name: players.name,
			active: players.active,
			isAdmin: players.isAdmin,
			mustChangePin: players.mustChangePin,
			lockedUntil: players.lockedUntil
		})
		.from(players)
		.orderBy(desc(players.active), asc(players.name))
		.all();
}

/** A forgotten code: a random temporary one, shown once to the admin. Signs the player out. */
export function resetPin(playerId: number): string {
	const temp = String(randomInt(0, 1_000_000)).padStart(6, '0');
	db.transaction((tx) => {
		const done = tx
			.update(players)
			.set({ pinHash: hashPin(temp), mustChangePin: true, failedLogins: 0, lockedUntil: null })
			.where(eq(players.id, playerId))
			.run();
		if (!done.changes) throw new AdminError('Joueur introuvable.');
		tx.delete(sessions).where(eq(sessions.playerId, playerId)).run();
	});
	return temp;
}

/** Changes to someone else's account only: an admin cannot lock themselves out by mistake. */
function guardOther(actorId: number, playerId: number) {
	if (actorId === playerId) throw new AdminError('Pas sur ton propre compte.');
}

export function setActive(actorId: number, playerId: number, active: boolean) {
	guardOther(actorId, playerId);
	db.update(players).set({ active }).where(eq(players.id, playerId)).run();
}

export function setAdmin(actorId: number, playerId: number, isAdmin: boolean) {
	guardOther(actorId, playerId);
	db.update(players)
		.set({ isAdmin })
		.where(and(eq(players.id, playerId), ne(players.id, actorId)))
		.run();
}

// ── Backups ─────────────────────────────────────────────────────────────────────

/**
 * A consistent copy of the whole league, taken with SQLite's online backup while the app runs
 * (copying the file directly could catch it mid-write).
 */
export async function backupBytes(): Promise<Buffer> {
	const dir = mkdtempSync(join(tmpdir(), 'mate-moi-'));
	try {
		const file = join(dir, 'backup.db');
		await sqlite.backup(file);
		return readFileSync(file);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
}
