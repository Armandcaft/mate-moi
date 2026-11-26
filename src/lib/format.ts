import type { Translate } from './i18n/index.ts';
import type { Result } from './tournament/types';

/** "Frank gagne", "Nulle" — a result in words, from the names of both players. */
export function describe(t: Translate, result: Result, white: string, black: string): string {
	if (result === '1/2-1/2') return t('game.draw');
	if (result === '0-0') return t('game.notPlayed');
	return t('game.wins', { name: result === '1-0' ? white : black });
}

export const score = (result: Result) => (result === '1/2-1/2' ? '½ – ½' : result.replace('-', ' – '));

/** A link that opens WhatsApp with `text` ready to send to the group. */
export const whatsapp = (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`;

/** A player's name as shown: a deleted player's (`~deleted-…`) becomes "Deleted player". */
export function playerName(t: Translate, p: { name: string; deletedAt: Date | null } | undefined): string {
	if (!p) return '?';
	return p.deletedAt ? t('player.deleted') : p.name;
}

// ── Dates (the week's deadline) ─────────────────────────────────────────────────
// `timeZone` undefined = the device's own. Pages pass `timeZone()` (zone.svelte.ts): UTC until the
// page is hydrated, so the server's render and the browser's first one say the same thing.

function parts(d: Date, timeZone: string | undefined) {
	const p = Object.fromEntries(
		new Intl.DateTimeFormat('en-GB', {
			timeZone,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			hourCycle: 'h23'
		})
			.formatToParts(d)
			.map((x) => [x.type, x.value])
	);
	return { y: +p.year, m: +p.month, d: +p.day, hh: p.hour, mm: p.minute };
}

/** Calendar days from `now` to `then` where the viewer is: 0 today, 1 tomorrow… */
export function daysUntil(then: Date, now: Date, timeZone?: string): number {
	const a = parts(now, timeZone);
	const b = parts(then, timeZone);
	return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86_400_000);
}

/** « aujourd'hui », « demain », « dans 3 j »; nothing once past. */
export function dayWords(t: Translate, days: number): string {
	if (days < 0) return '';
	if (days === 0) return t('week.today');
	if (days === 1) return t('week.tomorrow');
	return t('week.inDays', { n: days });
}

/** « dim. 30 nov., 23:59 » in `locale` (an `Intl` tag). */
export const dateTime = (d: Date, locale: string, timeZone?: string) =>
	new Intl.DateTimeFormat(locale, {
		timeZone,
		weekday: 'short',
		day: 'numeric',
		month: 'short',
		hour: '2-digit',
		minute: '2-digit'
	}).format(d);

/** For a message: « dimanche 23:59 » within the coming week, else the full `dateTime`. */
export function deadlineWords(d: Date, now: Date, locale: string, timeZone?: string): string {
	const days = daysUntil(d, now, timeZone);
	if (days < 0 || days > 6) return dateTime(d, locale, timeZone);
	return new Intl.DateTimeFormat(locale, { timeZone, weekday: 'long', hour: '2-digit', minute: '2-digit' }).format(d);
}

/** The value of an `<input type="datetime-local">`: 'YYYY-MM-DDTHH:mm' where the viewer is. */
export function localInput(d: Date, timeZone?: string): string {
	const p = parts(d, timeZone);
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${p.y}-${pad(p.m)}-${pad(p.d)}T${p.hh}:${p.mm}`;
}
