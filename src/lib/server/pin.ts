// Kept free of imports from the app so `scripts/player.ts` can load it with plain Node.
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

/**
 * A PIN is only digits, so the hash alone would not resist an offline guess.
 * `PIN_PEPPER` (a Fly.io secret, never in the database) makes a stolen database
 * file useless on its own; the login rate limit in `auth.ts` covers online guessing.
 */
const pepper = () => process.env.PIN_PEPPER ?? '';

/** New codes: 6 to 8 digits. Logging in still accepts the 4-digit codes from before. */
export const PIN_PATTERN = /^\d{6,8}$/;

/** Why `pin` would be a poor code, in French for the page, or null if it is fine. */
export function newPinProblem(pin: string): string | null {
	if (!PIN_PATTERN.test(pin)) return 'Le code doit faire 6 à 8 chiffres.';
	if (/^(\d)\1+$/.test(pin)) return 'Trop facile : un seul chiffre répété.';
	const digits = [...pin].map(Number);
	const steps = new Set(digits.slice(1).map((d, i) => (d - digits[i] + 10) % 10));
	if (steps.size === 1 && (steps.has(1) || steps.has(9))) return 'Trop facile : une suite de chiffres.';
	return null;
}

export function hashPin(pin: string): string {
	const salt = randomBytes(16).toString('hex');
	const hash = scryptSync(pin + pepper(), salt, 32).toString('hex');
	return `${salt}:${hash}`;
}

export function verifyPin(pin: string, stored: string): boolean {
	const [salt, hash] = stored.split(':');
	if (!salt || !hash) return false;
	const candidate = scryptSync(pin + pepper(), salt, 32);
	return timingSafeEqual(candidate, Buffer.from(hash, 'hex'));
}
