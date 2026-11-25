import { and, eq, ne, sql } from 'drizzle-orm';
import type { MessageKey, Params, Problem } from '../i18n/index.ts';
import { nameProblem, normalizeName, normalizeSlogan, sloganProblem } from '../profile.ts';
import { db, players } from './db/index.ts';
import type { Tx } from './league.ts';

/** A refusal, carrying a message key: the page puts it in the player's language. */
export class ProfileError extends Error implements Problem {
	constructor(
		readonly key: MessageKey,
		readonly params?: Params
	) {
		super(key);
	}
}

/** True if another player already uses `name`, ignoring case ("frank" = "Frank"). */
export function nameTaken(tx: Tx | typeof db, name: string, exceptId = -1): boolean {
	return !!tx
		.select({ id: players.id })
		.from(players)
		.where(and(sql`lower(${players.name}) = lower(${name})`, ne(players.id, exceptId)))
		.get();
}

/** A valid, free name from what the player typed, or a ProfileError saying why not. */
export function checkedName(tx: Tx | typeof db, raw: string, exceptId = -1): string {
	const name = normalizeName(raw);
	const problem = nameProblem(name);
	if (problem) throw new ProfileError(problem.key, problem.params);
	if (nameTaken(tx, name, exceptId)) throw new ProfileError('profile.nameTaken');
	return name;
}

/** Renaming changes it everywhere at once: games and history refer to the player, not the name. */
export function rename(playerId: number, raw: string): string {
	return db.transaction((tx) => {
		const name = checkedName(tx, raw, playerId);
		tx.update(players).set({ name }).where(eq(players.id, playerId)).run();
		return name;
	});
}

export function setSlogan(playerId: number, raw: string): string | null {
	const slogan = normalizeSlogan(raw);
	const problem = sloganProblem(slogan);
	if (problem) throw new ProfileError(problem.key, problem.params);
	db.update(players).set({ slogan }).where(eq(players.id, playerId)).run();
	return slogan;
}
