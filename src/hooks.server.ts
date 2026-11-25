import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit/hooks';
import { SESSION_COOKIE, playerFromSession } from '#lib/server/auth.ts';

const PUBLIC = ['/login', '/health'];
/** Link previews: WhatsApp fetches these without a session. They show only the standings. */
const PUBLIC_PREFIXES = ['/og/', '/partage/'];

/** Private league: every page but these needs a signed-in player. */
export const handle: Handle = async ({ event, resolve }) => {
	event.locals.player = playerFromSession(event.cookies.get(SESSION_COOKIE));

	const path = event.url.pathname;
	const isPublic = PUBLIC.includes(path) || PUBLIC_PREFIXES.some((p) => path.startsWith(p));
	if (!event.locals.player && !isPublic) redirect(303, '/login');

	// A temporary code must be replaced before anything else.
	if (event.locals.player?.mustChangePin && !isPublic && path !== '/code' && path !== '/logout')
		redirect(303, '/code');

	return resolve(event);
};
