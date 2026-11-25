import type { Translate } from './i18n/index.ts';
import type { Result } from './tournament/types';

/** "Frank gagne", "Nulle" — a result in words, from the names of both players. */
export function describe(t: Translate, result: Result, white: string, black: string): string {
	if (result === '1/2-1/2') return t('game.draw');
	return t('game.wins', { name: result === '1-0' ? white : black });
}

export const score = (result: Result) => (result === '1/2-1/2' ? '½ – ½' : result.replace('-', ' – '));

/** A link that opens WhatsApp with `text` ready to send to the group. */
export const whatsapp = (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`;
