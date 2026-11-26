// Invites, the admin's player management, and backups.
import { and, asc, desc, eq, gt, isNull, ne } from 'drizzle-orm';
import { randomBytes, randomInt } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { MessageKey, Params, Problem } from '../i18n/index.ts';
import { AccountError, deleteAccount, setArchived as archive } from './accounts.ts';
import { sha256 } from './auth.ts';
import { db, invites, players, sessions, sqlite, type Player } from './db/index.ts';
import { joinCurrentWeek } from './league.ts';
import { hashPin, newPinProblem } from './pin.ts';
import { ProfileError, checkedName } from './profile.ts';

/** A refusal, carrying a message key: the page puts it in the player's language. */
export class AdminError extends Error implements Problem {
	constructor(
		readonly key: MessageKey,
		readonly params?: Params
	) {
		super(key);
	}
}

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

/**
 * The newcomer creates their player with their own code; the invite is spent. If this week's
 * group stage is still running they join it at once (`joined`), otherwise from the next week.
 */
export function acceptInvite(
	token: string,
	rawName: string,
	pin: string
): { id: number; week: 'joined' | 'next-week' } {
	const problem = newPinProblem(pin);
	if (problem) throw new AdminError(problem.key, problem.params);

	return db.transaction((tx) => {
		const invite = tx
			.select()
			.from(invites)
			.where(and(eq(invites.id, sha256(token)), isNull(invites.usedAt), gt(invites.expiresAt, new Date())))
			.get();
		if (!invite) throw new AdminError('invite.expired');

		let name: string;
		try {
			name = checkedName(tx, rawName);
		} catch (e) {
			if (e instanceof ProfileError) throw new AdminError(e.key, e.params);
			throw e;
		}

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
		return { id: player.id, week: joinCurrentWeek(tx, player.id) };
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
		.where(isNull(players.deletedAt))
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
		if (!done.changes) throw new AdminError('admin.playerNotFound');
		tx.delete(sessions).where(eq(sessions.playerId, playerId)).run();
	});
	return temp;
}

/** Changes to someone else's account only: an admin cannot lock themselves out by mistake. */
function guardOther(actorId: number, playerId: number) {
	if (actorId === playerId) throw new AdminError('admin.notYourself');
}

/** `AccountError`s become `AdminError`s, so the admin page has one kind of refusal to show. */
function asAdmin<T>(fn: () => T): T {
	try {
		return fn();
	} catch (e) {
		if (e instanceof AccountError) throw new AdminError(e.key);
		throw e;
	}
}

/** Archive or restore (`accounts.ts`): archiving also takes them out of the open week. */
export function setArchived(actorId: number, playerId: number, archived: boolean) {
	guardOther(actorId, playerId);
	asAdmin(() => archive(playerId, archived));
}

/**
 * Delete someone else's account (`accounts.ts`). The admin types the player's exact name, so a
 * slip of the finger cannot do it. Returns the name, for the confirmation message.
 */
export function deletePlayer(actorId: number, playerId: number, typedName: string): string {
	guardOther(actorId, playerId);
	const player = db
		.select({ name: players.name })
		.from(players)
		.where(and(eq(players.id, playerId), isNull(players.deletedAt)))
		.get();
	if (!player) throw new AdminError('admin.playerNotFound');
	if (typedName.trim() !== player.name) throw new AdminError('admin.deleteNameMismatch');
	asAdmin(() => deleteAccount(playerId));
	return player.name;
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
