import { error, fail } from '@sveltejs/kit';
import {
	AdminError,
	allPlayers,
	createInvite,
	pendingInvites,
	resetPin,
	revokeInvite,
	setActive,
	setAdmin
} from '#lib/server/admin.ts';
import type { Actions, PageServerLoad, RequestEvent } from './$types';

/** Admins only. Others get the same 404 as a page that does not exist. */
function admin(locals: App.Locals) {
	if (!locals.player?.isAdmin) error(404, 'Page introuvable');
	return locals.player;
}

export const load: PageServerLoad = ({ locals }) => {
	admin(locals);
	return { players: allPlayers(), invites: pendingInvites() };
};

/** Run an admin action on the `player` in the form, turning refusals into a page message. */
async function onPlayer(
	{ request, locals }: RequestEvent,
	fn: (actorId: number, playerId: number) => Record<string, unknown> | void
) {
	const me = admin(locals);
	const playerId = Number((await request.formData()).get('player'));
	try {
		return fn(me.id, playerId) ?? undefined;
	} catch (e) {
		if (e instanceof AdminError) return fail(400, { message: e.message });
		throw e;
	}
}

export const actions: Actions = {
	invite: ({ locals, url }) => {
		const me = admin(locals);
		const { token, expiresAt } = createInvite(me.id);
		return { inviteLink: `${url.origin}/invitation/${token}`, expiresAt };
	},
	revoke: async ({ request, locals }) => {
		admin(locals);
		revokeInvite(String((await request.formData()).get('invite')));
	},
	reset: (e) =>
		onPlayer(e, (_, id) => {
			const temp = resetPin(id);
			return { tempPin: temp, tempFor: id };
		}),
	deactivate: (e) => onPlayer(e, (me, id) => setActive(me, id, false)),
	activate: (e) => onPlayer(e, (me, id) => setActive(me, id, true)),
	promote: (e) => onPlayer(e, (me, id) => setAdmin(me, id, true)),
	demote: (e) => onPlayer(e, (me, id) => setAdmin(me, id, false))
};
