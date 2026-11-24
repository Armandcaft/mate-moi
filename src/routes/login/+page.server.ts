import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { clearFailures, createSession, lockedFor, recordFailure } from '#lib/server/auth.ts';
import { db, players } from '#lib/server/db/index.ts';
import { activePlayers } from '#lib/server/league.ts';
import { verifyPin } from '#lib/server/pin.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	if (locals.player) redirect(303, '/');
	return { players: activePlayers().map((p) => ({ id: p.id, name: p.name })) };
};

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const form = await request.formData();
		const playerId = Number(form.get('player'));
		const pin = String(form.get('pin') ?? '');

		const player = db.select().from(players).where(eq(players.id, playerId)).get();
		if (!player || !player.active) return fail(400, { playerId, message: 'Choisis ton nom.' });

		const wait = lockedFor(player.id);
		if (wait > 0)
			return fail(429, {
				playerId,
				message: `Trop d’essais. Réessaie dans ${Math.ceil(wait / 60_000)} min.`
			});

		if (!verifyPin(pin, player.pinHash)) {
			recordFailure(player.id);
			return fail(400, { playerId, message: 'Code incorrect.' });
		}

		clearFailures(player.id);
		createSession(cookies, player.id, url.protocol === 'https:');
		redirect(303, '/');
	}
};
