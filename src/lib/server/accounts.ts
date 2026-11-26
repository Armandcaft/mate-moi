// Leaving the league: archiving (reversible) and deleting (personal data gone, games kept).
import { and, count, eq, isNull, ne, or } from 'drizzle-orm';
import type { MessageKey, Problem } from '../i18n/index.ts';
import { db, games, invites, players, pushSubscriptions, sessions } from './db/index.ts';
import type { LeagueEvent } from '../push-messages.ts';
import { leaveOpenWeek, type Tx } from './league.ts';
import { notify } from './push.ts';

/** A refusal, carrying a message key: the page puts it in the player's language. */
export class AccountError extends Error implements Problem {
	constructor(readonly key: MessageKey) {
		super(key);
	}
}

/** What a deleted player's name becomes. Real names start with a letter, so it frees the old one. */
export const deletedName = (id: number) => `~deleted-${id}`;
/** Not `salt:hash`: `verifyPin` rejects every code against it. */
const NO_PIN = 'deleted:';

/**
 * Archive (`active` false): signed out at once (sessions need an active player), hidden from the
 * login and new weeks, history kept. They also leave the open week (`leaveOpenWeek`). Restoring
 * brings them back from the next week. A deleted player cannot be restored.
 */
export function setArchived(playerId: number, archived: boolean) {
	const events: LeagueEvent[] = [];
	db.transaction((tx) => {
		if (archived) refuseOwner(tx, playerId);
		const done = tx
			.update(players)
			.set({ active: !archived })
			.where(and(eq(players.id, playerId), isNull(players.deletedAt)))
			.run();
		if (!done.changes) throw new AccountError('admin.playerNotFound');
		if (archived) leaveOpenWeek(tx, events);
	});
	notify(events);
}

/** The owner cannot be archived or deleted: ownership must be transferred first. */
function refuseOwner(tx: Tx, playerId: number) {
	const p = tx.select({ isOwner: players.isOwner }).from(players).where(eq(players.id, playerId)).get();
	if (p?.isOwner) throw new AccountError('admin.ownerProtected');
}

/** True if `playerId` is an admin and no other active admin is left to run the league. */
export function isLastAdmin(playerId: number): boolean {
	const me = db.select({ isAdmin: players.isAdmin }).from(players).where(eq(players.id, playerId)).get();
	if (!me?.isAdmin) return false;
	const others = db
		.select({ n: count() })
		.from(players)
		.where(
			and(eq(players.isAdmin, true), eq(players.active, true), isNull(players.deletedAt), ne(players.id, playerId))
		)
		.get();
	return (others?.n ?? 0) === 0;
}

/**
 * Delete an account: name, code, slogan, sessions and unused invites gone; the games stay, shown
 * as "deleted player". First they leave the open week like an archived player. Someone who never
 * played (or whose only games were just dropped from the open week) leaves no trace at all: the
 * row itself is removed (`erased`).
 */
export function deleteAccount(playerId: number): 'deleted' | 'erased' {
	const events: LeagueEvent[] = [];
	const outcome = db.transaction((tx): 'deleted' | 'erased' => {
		refuseOwner(tx, playerId);
		const left = tx
			.update(players)
			.set({ active: false })
			.where(and(eq(players.id, playerId), isNull(players.deletedAt)))
			.run();
		if (!left.changes) throw new AccountError('admin.playerNotFound');
		leaveOpenWeek(tx, events);

		tx.delete(sessions).where(eq(sessions.playerId, playerId)).run();
		tx.delete(pushSubscriptions).where(eq(pushSubscriptions.playerId, playerId)).run();
		tx.delete(invites)
			.where(and(eq(invites.createdById, playerId), isNull(invites.usedAt)))
			.run();

		const played = tx
			.select({ id: games.id })
			.from(games)
			.where(or(eq(games.whiteId, playerId), eq(games.blackId, playerId)))
			.limit(1)
			.get();
		if (!played) {
			// Spent invites point at the player (who sent it, who used it): nothing worth keeping.
			tx.delete(invites)
				.where(or(eq(invites.createdById, playerId), eq(invites.usedById, playerId)))
				.run();
			tx.delete(players).where(eq(players.id, playerId)).run();
			return 'erased';
		}

		tx.update(players)
			.set({
				deletedAt: new Date(),
				active: false,
				isAdmin: false,
				slogan: null,
				name: deletedName(playerId),
				pinHash: NO_PIN,
				mustChangePin: false,
				failedLogins: 0,
				lockedUntil: null
			})
			.where(eq(players.id, playerId))
			.run();
		return 'deleted';
	});
	notify(events);
	return outcome;
}
