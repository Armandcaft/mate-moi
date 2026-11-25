import { redirect } from '@sveltejs/kit';
import { LANG_COOKIE, isLocale } from '#lib/i18n/index.ts';
import type { RequestHandler } from './$types';

/** Only a path on this site: never `//elsewhere` or a full URL. */
const localPath = (s: string | null | undefined) => (s && s.startsWith('/') && !s.startsWith('//') ? s : null);

/**
 * The language switcher (a plain form, so it works without JS): remember the choice for a year,
 * then go back to the page it came from.
 */
export const POST: RequestHandler = async ({ request, cookies, url }) => {
	const form = await request.formData();
	const lang = form.get('lang');
	if (isLocale(lang))
		cookies.set(LANG_COOKIE, lang, {
			path: '/',
			maxAge: 365 * 86_400,
			sameSite: 'lax',
			httpOnly: false,
			secure: url.protocol === 'https:'
		});

	let back = localPath(String(form.get('back') ?? ''));
	if (!back) {
		const referer = request.headers.get('referer');
		try {
			const from = referer ? new URL(referer) : null;
			if (from && from.origin === url.origin) back = from.pathname + from.search;
		} catch {
			/* not a URL: go home */
		}
	}
	redirect(303, back ?? '/');
};
