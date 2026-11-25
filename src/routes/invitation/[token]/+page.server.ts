import { fail, redirect } from '@sveltejs/kit';
import { AdminError, acceptInvite, inviteIsValid } from '#lib/server/admin.ts';
import { createSession } from '#lib/server/auth.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params, locals, url }) => ({
	valid: inviteIsValid(params.token),
	signedIn: !!locals.player,
	image: `${url.origin}/og/invite.png`
});

export const actions: Actions = {
	default: async ({ params, request, cookies, url, locals }) => {
		if (locals.player)
			return fail(400, { name: '', message: 'Tu es déjà connecté : cette invitation est pour un nouveau joueur.' });
		const form = await request.formData();
		const name = String(form.get('name') ?? '');
		const pin = String(form.get('pin') ?? '');
		if (pin !== String(form.get('confirm') ?? ''))
			return fail(400, { name, message: 'Les deux codes ne correspondent pas.' });
		try {
			const id = acceptInvite(params.token, name, pin);
			createSession(cookies, id, url.protocol === 'https:');
		} catch (e) {
			if (e instanceof AdminError) return fail(400, { name, message: e.message });
			throw e;
		}
		redirect(303, '/?bienvenue');
	}
};
