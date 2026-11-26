import { describe, expect, it } from 'vitest';
import { translator } from './i18n/index.ts';
import { nudgeText, type NudgeGame } from './nudge.ts';

const NAMES: Record<number, string> = { 1: 'Frank', 2: 'Ryan', 3: 'Sam' };
const name = (id: number) => NAMES[id];
const g = (whiteId: number, blackId: number, extra: Partial<NudgeGame> = {}): NudgeGame => ({
	stage: 'group',
	whiteId,
	blackId,
	result: null,
	reportedById: null,
	confirmedAt: null,
	...extra
});
const link = 'https://mate-moi.fly.dev/';

describe('nudgeText', () => {
	it('lists the games to play per pair, the results to confirm, the deadline and the link', () => {
		const games = [
			g(1, 2),
			g(2, 1),
			g(1, 2, { result: '1-0', reportedById: 1 }),
			g(1, 3, { result: '0-1', reportedById: 3, confirmedAt: 1 }), // done: not mentioned
			g(3, 2)
		];
		const text = nudgeText(translator('fr'), { weekNumber: 4, phase: 'group', games, name, deadline: 'dimanche 23:59', link });
		expect(text).toBe(
			[
				'⏰ On relance ! Semaine 4 · Phase de groupes',
				'',
				'À jouer :',
				'• Frank – Ryan ×2',
				'• Ryan – Sam',
				'',
				'À confirmer :',
				'• Ryan doit confirmer Frank – Ryan',
				'',
				'⏳ Avant dimanche 23:59',
				'',
				link
			].join('\n')
		);
	});

	it('counts several results waiting for the same player', () => {
		const games = [g(1, 2, { result: '1-0', reportedById: 1 }), g(2, 1, { result: '0-1', reportedById: 1 })];
		const text = nudgeText(translator('en'), { weekNumber: 1, phase: 'group', games, name, link });
		expect(text).toContain('• Ryan must confirm Frank – Ryan ×2');
		expect(text).not.toContain('Before');
	});

	it('in the final, lists only the final, and never the deadline', () => {
		const games = [g(1, 2, { result: '1-0', reportedById: 1, confirmedAt: 1 }), g(1, 3, { stage: 'final' })];
		const text = nudgeText(translator('de'), { weekNumber: 2, phase: 'final', games, name, deadline: 'Sonntag 23:59', link });
		expect(text).toContain('Finale');
		expect(text).toContain('• Frank – Sam');
		expect(text).not.toContain('Ryan');
		expect(text).not.toContain('Bis');
		expect(text.endsWith(link)).toBe(true);
	});

	it('in a play-off, lists the play-off games', () => {
		const games = [g(2, 3, { stage: 'playoff' }), g(1, 2)];
		const text = nudgeText(translator('fr'), { weekNumber: 3, phase: 'playoff', games, name, link });
		expect(text).toContain('Barrage');
		expect(text).toContain('• Ryan – Sam');
		expect(text).not.toContain('Frank');
	});
});
