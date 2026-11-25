// Rules for what a player writes about themselves: their name and their slogan.

export const SLOGAN_MAX = 60;
const NAME_PATTERN = /^[\p{L}][\p{L}\p{M}' .-]{1,23}$/u;

/** Spaces trimmed and collapsed: "  Jean   Paul " → "Jean Paul". */
const tidy = (s: string) => s.trim().replace(/\s+/g, ' ');

export const normalizeName = tidy;

/** Why `name` (already normalized) cannot be a player's name, or null. */
export function nameProblem(name: string): string | null {
	return NAME_PATTERN.test(name) ? null : 'Ton nom : 2 à 24 lettres (espaces, tirets et apostrophes permis).';
}

/** The slogan as stored: tidied, and null when empty. */
export function normalizeSlogan(raw: string): string | null {
	const s = tidy(raw);
	return s ? s : null;
}

export function sloganProblem(slogan: string | null): string | null {
	if (slogan === null) return null;
	if ([...slogan].length > SLOGAN_MAX) return `Ta devise : ${SLOGAN_MAX} caractères maximum.`;
	if (/https?:\/\/|www\./i.test(slogan)) return 'Pas de liens dans la devise.';
	return null;
}
