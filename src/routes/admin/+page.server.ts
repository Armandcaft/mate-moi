import { error, fail } from '@sveltejs/kit';
import {
	AdminError,
	allPlayers,
	createInvite,
	pendingInvites,
	resetPin,
	revokeInvite,
	deletePlayer,
	setAdmin,
	setArchived,
	transferOwnership
} from '#lib/server/admin.ts';
import { LeagueError, latestWeek, setDeadline, sweep, weekView } from '#lib/server/league.ts';
import { say, translator } from '#lib/i18n/index.ts';
import type { Actions, PageServerLoad, RequestEvent } from './$types';

/**
 * Admins only. Others get the same 404 as a page that does not exist. Every load and action
 * passes here, so the week's time rules are applied first (`sweep`).
 */
function admin(locals: App.Locals) {
	if (!locals.player?.isAdmin) error(404, translator(locals.locale)('common.pageNotFound'));
	sweep();
	return locals.player;
}

export const load: PageServerLoad = ({ locals }) => {
	const me = admin(locals);
	const week = latestWeek();
	const view = week && !week.closedAt ? weekView(week) : null;
	return {
		players: allPlayers(),
		invites: pendingInvites(),
		meIsOwner: me.isOwner,
		/** The open week while its group stage runs: its deadline can be moved. */
		groupWeek: view?.step.phase === 'group' ? { number: view.week.number, deadline: view.week.deadline } : null
	};
};

/** Run an admin action on the `player` in the form, turning refusals into a page message. */
async function onPlayer(
	{ request, locals }: RequestEvent,
	fn: (actorId: number, playerId: number, form: FormData) => Record<string, unknown> | void
) {
	const me = admin(locals);
	const form = await request.formData();
	const playerId = Number(form.get('player'));
	try {
		return fn(me.id, playerId, form) ?? undefined;
	} catch (e) {
		if (e instanceof AdminError) return fail(400, { message: say(locals.locale, e) });
		throw e;
	}
}

export const actions: Actions = {
	invite: ({ locals, url }) => {
		const me = admin(locals);
		const { token, expiresAt } = createInvite(me.id);
		return { inviteLink: `${url.origin}/invitation/${token}`, expiresAt };
	},
	/** The browser sends the chosen local time as an ISO instant (with its zone). */
	deadline: async ({ request, locals }) => {
		admin(locals);
		const raw = String((await request.formData()).get('deadline') ?? '');
		const deadline = new Date(raw);
		try {
			setDeadline(deadline);
		} catch (e) {
			if (e instanceof LeagueError) return fail(400, { message: say(locals.locale, e) });
			throw e;
		}
		return { deadlineSaved: deadline };
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
	archive: (e) => onPlayer(e, (me, id) => setArchived(me, id, true)),
	unarchive: (e) => onPlayer(e, (me, id) => setArchived(me, id, false)),
	delete: (e) =>
		onPlayer(e, (me, id, form) => ({ deleted: deletePlayer(me, id, String(form.get('name') ?? '')) })),
	transfer: (e) =>
		onPlayer(e, (me, id, form) => ({
			transferred: transferOwnership(me, id, String(form.get('name') ?? ''))
		})),
	promote: (e) => onPlayer(e, (me, id) => setAdmin(me, id, true)),
	demote: (e) => onPlayer(e, (me, id) => setAdmin(me, id, false))
};
