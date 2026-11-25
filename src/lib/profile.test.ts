import { describe, expect, it } from 'vitest';
import { nameProblem, normalizeName, normalizeSlogan, sloganProblem } from './profile';

describe('names', () => {
	it('tidies spaces', () => {
		expect(normalizeName('  Jean   Paul ')).toBe('Jean Paul');
	});

	it.each(['Al', 'Frank', 'Zoé', "N'Golo", 'Jean-Paul', 'Ulrich K.', 'Ébène'])('accepts %s', (n) => {
		expect(nameProblem(n)).toBeNull();
	});

	it.each(['A', '', '1Frank', 'Frank!', '<b>x</b>', 'A'.repeat(25), '🙂Frank'])('refuses "%s"', (n) => {
		expect(nameProblem(n)).not.toBeNull();
	});
});

describe('slogans', () => {
	it('stores an empty slogan as none', () => {
		expect(normalizeSlogan('   ')).toBeNull();
	});

	it('tidies spaces and keeps emoji', () => {
		expect(normalizeSlogan('  Je mate,   donc je suis ♔ ')).toBe('Je mate, donc je suis ♔');
	});

	it('allows 60 characters, emoji counting as one', () => {
		expect(sloganProblem('x'.repeat(60))).toBeNull();
		expect(sloganProblem('♔'.repeat(60))).toBeNull();
		expect(sloganProblem('x'.repeat(61))).toEqual({ key: 'profile.sloganTooLong', params: { max: 60 } });
	});

	it('refuses links', () => {
		expect(sloganProblem('va sur https://exemple.com')).toEqual({ key: 'profile.sloganLink' });
		expect(sloganProblem('www.exemple.com')).toEqual({ key: 'profile.sloganLink' });
	});

	it('accepts no slogan at all', () => {
		expect(sloganProblem(null)).toBeNull();
	});
});
