import { redirect } from '@sveltejs/kit';
import { THEME_COOKIE, isTheme } from '#lib/theme.ts';
import type { RequestHandler } from './$types';

/** Only a path on this site: never `//elsewhere` or a full URL. */
const localPath = (s: string | null | undefined) => (s && s.startsWith('/') && !s.startsWith('//') ? s : null);

/**
 * The theme switcher on the profile (a plain form, so it works without JS): remember the choice
 * for a year (`auto` forgets it), then go back to the page it came from.
 */
export const POST: RequestHandler = async ({ request, cookies, url }) => {
	const form = await request.formData();
	const theme = form.get('theme');
	const options = { path: '/', sameSite: 'lax', httpOnly: false, secure: url.protocol === 'https:' } as const;
	if (theme === 'auto') cookies.delete(THEME_COOKIE, options);
	else if (isTheme(theme)) cookies.set(THEME_COOKIE, theme, { ...options, maxAge: 365 * 86_400 });

	redirect(303, localPath(String(form.get('back') ?? '')) ?? '/profil');
};
