import type { Result } from './tournament/types';

export const PHASE_LABEL = {
	group: 'Phase de groupes',
	playoff: 'Barrage',
	final: 'Finale',
	done: 'Couronné'
} as const;

export const STAGE_LABEL = { group: 'Groupe', playoff: 'Barrage', final: 'Finale' } as const;

/** "Frank gagne", "Nulle" — a result in words, from the names of both players. */
export function describe(result: Result, white: string, black: string): string {
	if (result === '1/2-1/2') return 'Nulle';
	return `${result === '1-0' ? white : black} gagne`;
}

export const score = (result: Result) => (result === '1/2-1/2' ? '½ – ½' : result.replace('-', ' – '));

/** A link that opens WhatsApp with `text` ready to send to the group. */
export const whatsapp = (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`;
