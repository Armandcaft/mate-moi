import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { clearFailures, createSession, lockMessage, lockedFor, recordFailure } from '#lib/server/auth.ts';
import { db, players } from '#lib/server/db/index.ts';
import { activePlayers } from '#lib/server/league.ts';
import { verifyPin } from '#lib/server/pin.ts';
import { say } from '#lib/i18n/index.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, url }) => {
	if (locals.player) redirect(303, '/');
	return {
		/** Just deleted their account (`/profil`). */
		bye: url.searchParams.has('bye'),
		players: activePlayers().map((p) => ({ id: p.id, name: p.name, slogan: p.slogan }))
	};
};

export const actions: Actions = {
	default: async ({ request, cookies, url, locals }) => {
		const form = await request.formData();
		const playerId = Number(form.get('player'));
		const pin = String(form.get('pin') ?? '');

		const player = db.select().from(players).where(eq(players.id, playerId)).get();
		if (!player || !player.active) return fail(400, { playerId, message: say(locals.locale, { key: 'login.chooseName' }) });

		const wait = lockedFor(player);
		if (wait > 0) return fail(429, { playerId, message: say(locals.locale, lockMessage(wait)) });

		if (!verifyPin(pin, player.pinHash)) {
			const locked = recordFailure(player.id);
			if (locked) return fail(429, { playerId, message: say(locals.locale, lockMessage(locked)) });
			return fail(400, { playerId, message: say(locals.locale, { key: 'login.wrongCode' }) });
		}

		clearFailures(player.id);
		createSession(cookies, player.id, url.protocol === 'https:');
		// A temporary code from the admin: the hook sends them to choose their own.
		redirect(303, player.mustChangePin ? '/code' : '/');
	}
};
