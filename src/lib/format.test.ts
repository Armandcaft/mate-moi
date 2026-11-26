import { describe, expect, it } from 'vitest';
import { dateTime, dayWords, daysUntil, deadlineWords, describe as words, localInput, score } from './format.ts';
import { translator } from './i18n/index.ts';

const PARIS = 'Europe/Paris';
// Wednesday 26 Nov 2026, 10:00 in Paris.
const now = new Date('2026-11-26T09:00:00Z');

describe('dates', () => {
	it('counts calendar days where the viewer is', () => {
		expect(daysUntil(new Date('2026-11-26T22:30:00Z'), now, PARIS)).toBe(0); // 23:30 Paris
		expect(daysUntil(new Date('2026-11-26T23:30:00Z'), now, PARIS)).toBe(1); // 00:30 Paris, next day
		expect(daysUntil(new Date('2026-11-26T23:30:00Z'), now, 'UTC')).toBe(0);
		expect(daysUntil(new Date('2026-11-30T22:59:00Z'), now, PARIS)).toBe(4);
	});

	it('says today, tomorrow, in n days', () => {
		const t = translator('fr');
		expect(dayWords(t, 0)).toBe('aujourd’hui');
		expect(dayWords(t, 1)).toBe('demain');
		expect(dayWords(t, 4)).toBe('dans 4 j');
		expect(dayWords(t, -1)).toBe('');
	});

	it('writes the deadline in the viewer’s language', () => {
		const sunday = new Date('2026-11-29T22:59:00Z'); // Sunday 23:59 in Paris
		expect(dateTime(sunday, 'fr-FR', PARIS)).toBe('dim. 29 nov., 23:59');
		expect(deadlineWords(sunday, now, 'fr-FR', PARIS)).toBe('dimanche 23:59');
		expect(deadlineWords(sunday, now, 'en-GB', PARIS)).toMatch(/^Sunday,? 23:59$/);
		expect(deadlineWords(new Date('2026-12-10T10:00:00Z'), now, 'fr-FR', PARIS)).toBe('jeu. 10 déc., 11:00');
	});

	it('fills a datetime-local input', () => {
		expect(localInput(new Date('2026-11-29T22:59:00Z'), PARIS)).toBe('2026-11-29T23:59');
		expect(localInput(new Date('2026-11-29T22:59:00Z'), 'UTC')).toBe('2026-11-29T22:59');
	});
});

describe('0-0', () => {
	it('reads as not played', () => {
		expect(score('0-0')).toBe('0 – 0');
		expect(words(translator('fr'), '0-0', 'A', 'B')).toBe('non jouée');
	});
});
