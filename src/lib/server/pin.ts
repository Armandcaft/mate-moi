// Kept free of imports from the app so `scripts/player.ts` can load it with plain Node.
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

/**
 * A PIN is only 4–8 digits, so the hash alone would not resist an offline guess.
 * `PIN_PEPPER` (a Fly.io secret, never in the database) makes a stolen database
 * file useless on its own; the login rate limit in `auth.ts` covers online guessing.
 */
const pepper = () => process.env.PIN_PEPPER ?? '';

export const PIN_PATTERN = /^\d{4,8}$/;

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
