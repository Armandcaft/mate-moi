// The colour theme a player chose on their profile. `auto` (the default) follows the device.

export const THEMES = ['auto', 'light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

/** The cookie holding the choice; without it, `auto`. */
export const THEME_COOKIE = 'mm_theme';

export const isTheme = (s: unknown): s is Theme => THEMES.includes(s as Theme);

/** The page background of each theme, for the browser's own chrome (`theme-color`). */
const BOARD = { light: '#f4f2ec', dark: '#0b0b0d' } as const;

/**
 * What the page's HTML says about the theme: the attribute on <html> (none for `auto`, so the
 * stylesheet's media query decides and nothing flashes), and the head tags that tell the browser.
 */
export function themeMarkup(theme: Theme): { attr: string; head: string } {
	if (theme === 'auto')
		return {
			attr: '',
			head:
				'<meta name="color-scheme" content="light dark" />' +
				`<meta name="theme-color" media="(prefers-color-scheme: light)" content="${BOARD.light}" />` +
				`<meta name="theme-color" media="(prefers-color-scheme: dark)" content="${BOARD.dark}" />`
		};
	return {
		attr: ` data-theme="${theme}"`,
		head:
			`<meta name="color-scheme" content="${theme}" />` +
			`<meta name="theme-color" content="${BOARD[theme]}" />`
	};
}
