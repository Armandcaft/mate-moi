import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit/hooks';
import { SESSION_COOKIE, playerFromSession } from '#lib/server/auth.ts';

const PUBLIC = ['/login'];

/** Private league: every page but the login needs a signed-in player. */
export const handle: Handle = async ({ event, resolve }) => {
	event.locals.player = playerFromSession(event.cookies.get(SESSION_COOKIE));

	const isPublic = PUBLIC.includes(event.url.pathname) || event.url.pathname === '/health';
	if (!event.locals.player && !isPublic) redirect(303, '/login');

	return resolve(event);
};
