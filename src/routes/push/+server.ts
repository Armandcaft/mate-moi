import { error } from '@sveltejs/kit';
import { parseSubscription, pushConfig, saveSubscription } from '#lib/server/push.ts';
import type { RequestHandler } from './$types';

/** This browser wants notifications for the signed-in player, in the page's language. */
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.player) error(401);
	if (!pushConfig()) error(404);
	const sub = parseSubscription(await request.json().catch(() => null));
	if (!sub) error(400);
	saveSubscription(locals.player.id, sub, locals.locale);
	return new Response(null, { status: 204 });
};
