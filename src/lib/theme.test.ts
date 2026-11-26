import { describe, expect, it } from 'vitest';
import { isTheme, themeMarkup } from './theme.ts';

describe('themeMarkup', () => {
	it('leaves auto to the device: no attribute, a theme-color per scheme', () => {
		const { attr, head } = themeMarkup('auto');
		expect(attr).toBe('');
		expect(head).toContain('content="light dark"');
		expect(head).toContain('media="(prefers-color-scheme: light)" content="#f4f2ec"');
		expect(head).toContain('media="(prefers-color-scheme: dark)" content="#0b0b0d"');
	});

	it('forces a chosen theme on <html> and in the browser chrome', () => {
		expect(themeMarkup('light')).toEqual({
			attr: ' data-theme="light"',
			head: '<meta name="color-scheme" content="light" /><meta name="theme-color" content="#f4f2ec" />'
		});
		expect(themeMarkup('dark').attr).toBe(' data-theme="dark"');
	});

	it('accepts only the three choices', () => {
		expect(['auto', 'light', 'dark'].every(isTheme)).toBe(true);
		expect(isTheme('sepia')).toBe(false);
		expect(isTheme('" onload="x')).toBe(false);
	});
});
