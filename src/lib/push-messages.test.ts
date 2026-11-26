import { describe, expect, it } from 'vitest';
import { translator } from './i18n/index.ts';
import { pushMessage, recipients, type LeagueEvent } from './push-messages.ts';

const NAMES: Record<number, string> = { 1: 'Frank', 2: 'Ryan', 3: 'Sam' };
const name = (id: number) => NAMES[id];
const fr = translator('fr');

describe('push messages', () => {
	const reported: LeagueEvent = { type: 'reported', reporterId: 1, whiteId: 1, blackId: 2, result: '1-0' };

	it('tells the opponent a result waits for them', () => {
		expect(recipients(reported)).toEqual([2]);
		expect(pushMessage(fr, reported, 2, name)).toEqual({
			title: 'Résultat à confirmer',
			body: 'Frank a déclaré : Frank gagne. À toi de confirmer',
			url: '/'
		});
		expect(recipients({ ...reported, reporterId: 2 })).toEqual([1]);
	});

	it('tells each finalist who they face', () => {
		const final: LeagueEvent = { type: 'final', finalists: [1, 3], armageddon: false };
		expect(recipients(final)).toEqual([1, 3]);
		expect(pushMessage(fr, final, 1, name).body).toBe('Tu joues la finale contre Sam');
		expect(pushMessage(fr, final, 3, name).body).toBe('Tu joues la finale contre Frank');
		expect(pushMessage(translator('en'), { ...final, armageddon: true }, 3, name).body).toBe(
			'Drawn final: Armageddon against Frank'
		);
	});

	it('tells everyone about the new King', () => {
		const king: LeagueEvent = { type: 'king', kingId: 3, week: 4 };
		expect(recipients(king)).toBe('everyone');
		expect(pushMessage(fr, king, 1, name).body).toBe('♔ Sam est le Roi de la Semaine 4');
		expect(pushMessage(translator('de'), king, 1, name).body).toBe('♔ Sam ist König der Woche 4');
	});

	it('tells both players of a result confirmed by the clock', () => {
		const auto: LeagueEvent = { type: 'autoConfirmed', whiteId: 1, blackId: 2, result: '1/2-1/2' };
		expect(recipients(auto)).toEqual([1, 2]);
		expect(pushMessage(fr, auto, 2, name).body).toBe('Validé automatiquement après 48 h : Frank – Ryan, Nulle');
	});
});
