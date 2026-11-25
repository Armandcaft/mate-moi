// Translations for the server and the browser. French is the source of truth (`fr.ts`).
import { de } from './de.ts';
import { en } from './en.ts';
import { fr, type Messages } from './fr.ts';

export type { Messages };

export const LOCALES = ['fr', 'en', 'de'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'fr';

/** The cookie holding the chosen language. */
export const LANG_COOKIE = 'mm_lang';

/** Each language's name in itself, for the switcher. */
export const LANGUAGE_NAMES: Record<Locale, string> = { fr: 'Français', en: 'English', de: 'Deutsch' };

/** The locale `Intl` formats dates with. */
export const DATE_LOCALE: Record<Locale, string> = { fr: 'fr-FR', en: 'en-GB', de: 'de-DE' };

export const isLocale = (s: unknown): s is Locale => LOCALES.includes(s as Locale);

export type Plural = { one: string; other: string };

/** Every key of the dictionaries, dotted: 'week.label', 'common.pts'… */
type Paths<T> = {
	[K in keyof T & string]: T[K] extends string | Plural ? K : `${K}.${Paths<T[K]>}`;
}[keyof T & string];
export type MessageKey = Paths<Messages>;

export type Params = Record<string, string | number>;

/** A message not yet in words: what server code returns or throws, translated at the page. */
export interface Problem {
	key: MessageKey;
	params?: Params;
}

const DICTIONARIES: Record<Locale, Messages> = { fr, en, de };

function lookup(dict: Messages, key: string): string | Plural | undefined {
	let node: unknown = dict;
	for (const part of key.split('.')) node = (node as Record<string, unknown> | undefined)?.[part];
	return typeof node === 'string' || (typeof node === 'object' && node && 'other' in node)
		? (node as string | Plural)
		: undefined;
}

export type Translate = (key: MessageKey, params?: Params) => string;

const cache = new Map<Locale, Translate>();

/**
 * `t(key, params)` in `locale`. `{name}` takes `params.name`; a plural picks its form from
 * `params.n` with the language's own rules (French: 0 and 1 are singular).
 */
export function translator(locale: Locale): Translate {
	let t = cache.get(locale);
	if (t) return t;
	const dict = DICTIONARIES[locale];
	const rules = new Intl.PluralRules(locale);
	t = (key, params) => {
		let text = lookup(dict, key) ?? lookup(fr, key) ?? key;
		if (typeof text !== 'string') text = rules.select(Number(params?.n ?? 0)) === 'one' ? text.one : text.other;
		return text.replace(/\{(\w+)\}/g, (whole, name: string) =>
			params && params[name] !== undefined ? String(params[name]) : whole
		);
	};
	cache.set(locale, t);
	return t;
}

/** A Problem in words. */
export const say = (locale: Locale, p: Problem) => translator(locale)(p.key, p.params);

/** The first language of an Accept-Language header that we have, else French. */
export function pickLocale(header: string | null | undefined): Locale {
	if (!header) return DEFAULT_LOCALE;
	const wanted = header
		.split(',')
		.map((part, i) => {
			const [tag, ...rest] = part.trim().split(';');
			const q = rest.map((r) => r.trim()).find((r) => r.startsWith('q='));
			const weight = q ? Number(q.slice(2)) : 1;
			return { lang: tag.trim().toLowerCase().split('-')[0], q: Number.isFinite(weight) ? weight : 0, i };
		})
		.filter((w) => w.q > 0)
		.sort((a, b) => b.q - a.q || a.i - b.i);
	return wanted.find((w) => isLocale(w.lang))?.lang as Locale | undefined ?? DEFAULT_LOCALE;
}
