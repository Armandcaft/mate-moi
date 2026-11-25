// Rules for what a player writes about themselves: their name and their slogan.
import type { Problem } from './i18n/index.ts';

export const SLOGAN_MAX = 60;
const NAME_PATTERN = /^[\p{L}][\p{L}\p{M}' .-]{1,23}$/u;

/** Spaces trimmed and collapsed: "  Jean   Paul " → "Jean Paul". */
const tidy = (s: string) => s.trim().replace(/\s+/g, ' ');

export const normalizeName = tidy;

/** Why `name` (already normalized) cannot be a player's name, or null. */
export function nameProblem(name: string): Problem | null {
	return NAME_PATTERN.test(name) ? null : { key: 'profile.badName' };
}

/** The slogan as stored: tidied, and null when empty. */
export function normalizeSlogan(raw: string): string | null {
	const s = tidy(raw);
	return s ? s : null;
}

export function sloganProblem(slogan: string | null): Problem | null {
	if (slogan === null) return null;
	if ([...slogan].length > SLOGAN_MAX) return { key: 'profile.sloganTooLong', params: { max: SLOGAN_MAX } };
	if (/https?:\/\/|www\./i.test(slogan)) return { key: 'profile.sloganLink' };
	return null;
}
