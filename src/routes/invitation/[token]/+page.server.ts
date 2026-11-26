import { fail, redirect } from '@sveltejs/kit';
import { AdminError, acceptInvite, inviteIsValid } from '#lib/server/admin.ts';
import { createSession } from '#lib/server/auth.ts';
import { sweep } from '#lib/server/league.ts';
import { say } from '#lib/i18n/index.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params, locals, url }) => ({
	valid: inviteIsValid(params.token),
	signedIn: !!locals.player,
	image: `${url.origin}/og/invite.png?lang=${locals.locale}`
});

export const actions: Actions = {
	default: async ({ params, request, cookies, url, locals }) => {
		if (locals.player)
			return fail(400, { name: '', message: say(locals.locale, { key: 'invite.alreadySignedIn' }) });
		const form = await request.formData();
		const name = String(form.get('name') ?? '');
		const pin = String(form.get('pin') ?? '');
		if (pin !== String(form.get('confirm') ?? ''))
			return fail(400, { name, message: say(locals.locale, { key: 'invite.mismatch' }) });
		let week: 'joined' | 'next-week';
		sweep(); // the week's state decides whether they join it now
		try {
			const joined = acceptInvite(params.token, name, pin);
			createSession(cookies, joined.id, url.protocol === 'https:');
			week = joined.week;
		} catch (e) {
			if (e instanceof AdminError) return fail(400, { name, message: say(locals.locale, e) });
			throw e;
		}
		redirect(303, week === 'joined' ? '/?bienvenue' : '/');
	}
};
