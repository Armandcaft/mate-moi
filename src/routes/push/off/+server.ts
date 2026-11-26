import { error } from '@sveltejs/kit';
import { deleteSubscription } from '#lib/server/push.ts';
import type { RequestHandler } from './$types';

/** This browser no longer wants notifications (its `endpoint` in the body). */
const off: RequestHandler = async ({ request, locals }) => {
	if (!locals.player) error(401);
	const body = (await request.json().catch(() => null)) as { endpoint?: unknown } | null;
	if (typeof body?.endpoint !== 'string') error(400);
	deleteSubscription(locals.player.id, body.endpoint);
	return new Response(null, { status: 204 });
};

export const POST = off;
export const DELETE = off;
