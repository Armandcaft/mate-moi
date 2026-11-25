import { describe, expect, it } from 'vitest';
import { de } from './de.ts';
import { en } from './en.ts';
import { fr } from './fr.ts';
import { LOCALES, isLocale, pickLocale, say, translator } from './index.ts';

type Tree = { [k: string]: string | Tree };

/** Every leaf as [dotted key, text]; a plural's forms are leaves `key.one`, `key.other`. */
function leaves(tree: Tree, prefix = ''): [string, string][] {
	return Object.entries(tree).flatMap(([k, v]) =>
		typeof v === 'string' ? [[prefix + k, v] as [string, string]] : leaves(v, `${prefix}${k}.`)
	);
}

/** The {params} each message uses, plural forms merged under the message's key. */
function params(tree: Tree): Map<string, Set<string>> {
	const out = new Map<string, Set<string>>();
	for (const [key, text] of leaves(tree)) {
		const id = key.replace(/\.(one|other)$/, '');
		const set = out.get(id) ?? new Set<string>();
		for (const m of text.matchAll(/\{(\w+)\}/g)) set.add(m[1]);
		out.set(id, set);
	}
	return out;
}

const others = { en, de } as Record<string, Tree>;

describe('dictionaries', () => {
	it.each(Object.keys(others))('%s has exactly the French keys', (lang) => {
		expect(leaves(others[lang]).map(([k]) => k).sort()).toEqual(leaves(fr).map(([k]) => k).sort());
	});

	it.each(Object.keys(others))('%s uses every parameter the French message does', (lang) => {
		const theirs = params(others[lang]);
		for (const [key, needed] of params(fr))
			for (const p of needed) expect(theirs.get(key), `${lang} ${key} lacks {${p}}`).toContain(p);
	});

	it.each(Object.keys(others))('%s leaves no message empty', (lang) => {
		for (const [key, text] of leaves(others[lang])) expect(text.trim(), key).not.toBe('');
	});
});

describe('translator', () => {
	it('fills parameters', () => {
		expect(translator('fr')('week.label', { n: 3 })).toBe('Semaine 3');
		expect(translator('en')('game.wins', { name: 'Sam' })).toBe('Sam wins');
		expect(translator('de')('week.king', { n: 7 })).toBe('König der Woche 7');
	});

	it('leaves a missing parameter visible', () => {
		expect(translator('fr')('game.wins')).toBe('{name} gagne');
	});

	it('picks plural forms by each language’s rules', () => {
		const fr = translator('fr');
		const en = translator('en');
		expect(fr('common.pts', { n: 0 })).toBe('0 pt');
		expect(fr('common.pts', { n: 1 })).toBe('1 pt');
		expect(fr('common.pts', { n: 3 })).toBe('3 pts');
		expect(en('common.pts', { n: 0 })).toBe('0 pts');
		expect(en('common.pts', { n: 1 })).toBe('1 pt');
		expect(fr('kings.crowns', { n: 1 })).toBe('1 couronne');
		expect(fr('kings.crowns', { n: 2 })).toBe('2 couronnes');
		expect(translator('de')('kings.crowns', { n: 2 })).toBe('2 Kronen');
	});

	it('translates a problem', () => {
		expect(say('en', { key: 'profile.sloganTooLong', params: { max: 60 } })).toBe('Your motto: 60 characters max.');
	});
});

describe('locales', () => {
	it('knows its own', () => {
		for (const l of LOCALES) expect(isLocale(l)).toBe(true);
		expect(isLocale('es')).toBe(false);
		expect(isLocale(undefined)).toBe(false);
	});

	it.each([
		['de-DE,de;q=0.9', 'de'],
		['es,en;q=0.8', 'en'],
		['en-US,en;q=0.9,fr;q=0.8', 'en'],
		['es;q=0.9,de;q=0.5,en;q=0.7', 'en'],
		['FR-ca', 'fr'],
		['en;q=0,de', 'de'],
		['*', 'fr'],
		['garbage;;;,,', 'fr'],
		['', 'fr'],
		[null, 'fr']
	])('picks from Accept-Language "%s" → %s', (header, want) => {
		expect(pickLocale(header)).toBe(want);
	});
});
