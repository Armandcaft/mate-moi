import { describe, expect, it } from 'vitest';
import { hashPin, newPinProblem, verifyPin } from './pin';

describe('hashPin / verifyPin', () => {
	it('verifies the right code and rejects others', () => {
		const stored = hashPin('482915');
		expect(verifyPin('482915', stored)).toBe(true);
		expect(verifyPin('482916', stored)).toBe(false);
	});

	it('salts every hash', () => {
		expect(hashPin('482915')).not.toBe(hashPin('482915'));
	});

	it('still verifies the 4-digit codes created before the 6-digit rule', () => {
		expect(verifyPin('1234', hashPin('1234'))).toBe(true);
	});

	it('depends on the pepper', () => {
		const stored = hashPin('482915');
		process.env.PIN_PEPPER = 'another';
		try {
			expect(verifyPin('482915', stored)).toBe(false);
		} finally {
			delete process.env.PIN_PEPPER;
		}
	});

	it('rejects a malformed stored value', () => {
		expect(verifyPin('482915', 'garbage')).toBe(false);
	});
});

describe('newPinProblem', () => {
	it.each(['482915', '7305128', '19283746'])('accepts %s', (pin) => {
		expect(newPinProblem(pin)).toBeNull();
	});

	it.each(['1234', '12345', '123456789', '12a456', ''])('rejects the length or format of "%s"', (pin) => {
		expect(newPinProblem(pin)).toMatch(/6 à 8 chiffres/);
	});

	it.each(['000000', '777777'])('rejects a repeated digit: %s', (pin) => {
		expect(newPinProblem(pin)).toMatch(/répété/);
	});

	it.each(['123456', '654321', '789012', '2109876'])('rejects a run: %s', (pin) => {
		expect(newPinProblem(pin)).toMatch(/suite/);
	});
});
