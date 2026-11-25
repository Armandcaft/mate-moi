// Kept free of imports from the app so `scripts/player.ts` can load it with plain Node.
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { Problem } from '../i18n/index.ts';

/**
 * A PIN is only digits, so the hash alone would not resist an offline guess.
 * `PIN_PEPPER` (a Fly.io secret, never in the database) makes a stolen database
 * file useless on its own; the login rate limit in `auth.ts` covers online guessing.
 */
const pepper = () => process.env.PIN_PEPPER ?? '';

/** New codes: 6 to 8 digits. Logging in still accepts the 4-digit codes from before. */
export const PIN_PATTERN = /^\d{6,8}$/;

/** Why `pin` would be a poor code (a message key, translated by the page), or null if it is fine. */
export function newPinProblem(pin: string): Problem | null {
	if (!PIN_PATTERN.test(pin)) return { key: 'pin.length' };
	if (/^(\d)\1+$/.test(pin)) return { key: 'pin.repeated' };
	const digits = [...pin].map(Number);
	const steps = new Set(digits.slice(1).map((d, i) => (d - digits[i] + 10) % 10));
	if (steps.size === 1 && (steps.has(1) || steps.has(9))) return { key: 'pin.run' };
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
