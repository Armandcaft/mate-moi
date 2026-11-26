import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit/hooks';
import { SESSION_COOKIE, playerFromSession } from '#lib/server/auth.ts';
import { DEFAULT_LOCALE, LANG_COOKIE, isLocale, pickLocale, type Locale } from '#lib/i18n/index.ts';
import { THEME_COOKIE, isTheme, themeMarkup } from '#lib/theme.ts';

/** `/lang` switches the language, so the login and invitation pages can use it. */
const PUBLIC = ['/login', '/health', '/lang'];
/**
 * Link previews (WhatsApp fetches these without a session; they show only the standings) and
 * invitations (the newcomer has no account yet; the token is the authorization).
 */
const PUBLIC_PREFIXES = ['/og/', '/partage/', '/invitation/'];
/** WhatsApp fetches previews without cookies: their language is in the link (`?lang=`), else French. */
const PREVIEW_PREFIXES = ['/og/', '/partage/'];

function localeOf(event: Parameters<Handle>[0]['event']): Locale {
	const path = event.url.pathname;
	if (PREVIEW_PREFIXES.some((p) => path.startsWith(p))) {
		const lang = event.url.searchParams.get('lang');
		return isLocale(lang) ? lang : DEFAULT_LOCALE;
	}
	const chosen = event.cookies.get(LANG_COOKIE);
	return isLocale(chosen) ? chosen : pickLocale(event.request.headers.get('accept-language'));
}

/** Private league: every page but these needs a signed-in player. */
export const handle: Handle = async ({ event, resolve }) => {
	event.locals.player = playerFromSession(event.cookies.get(SESSION_COOKIE));
	const locale = (event.locals.locale = localeOf(event));
	const chosen = event.cookies.get(THEME_COOKIE);
	const theme = (event.locals.theme = isTheme(chosen) ? chosen : 'auto');

	const path = event.url.pathname;
	const isPublic = PUBLIC.includes(path) || PUBLIC_PREFIXES.some((p) => path.startsWith(p));
	if (!event.locals.player && !isPublic) redirect(303, '/login');

	// A temporary code must be replaced before anything else.
	if (event.locals.player?.mustChangePin && !isPublic && path !== '/code' && path !== '/logout')
		redirect(303, '/code');

	// `auto` adds no attribute: the stylesheet follows the device, with no flash either way.
	const { attr, head } = themeMarkup(theme);
	return resolve(event, {
		transformPageChunk: ({ html }) =>
			html.replace('%lang%', locale).replace('%theme%', attr).replace('%theme.head%', head)
	});
};
