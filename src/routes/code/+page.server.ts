import { error, fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { lockMessage, lockedFor, recordFailure, setOwnPin } from '#lib/server/auth.ts';
import { db, players } from '#lib/server/db/index.ts';
import { hashPin, newPinProblem, verifyPin } from '#lib/server/pin.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => ({
	forced: locals.player!.mustChangePin
});

export const actions: Actions = {
	default: async ({ request, locals, cookies }) => {
		if (!locals.player) error(401);
		// Read the row fresh: the lockout may have changed since the session was loaded.
		const me = db.select().from(players).where(eq(players.id, locals.player.id)).get()!;

		const form = await request.formData();
		const current = String(form.get('current') ?? '');
		const next = String(form.get('next') ?? '');
		const confirm = String(form.get('confirm') ?? '');

		// A stolen, still-open session must not let someone guess the code here either.
		const wait = lockedFor(me);
		if (wait > 0) return fail(429, { message: lockMessage(wait) });
		if (!verifyPin(current, me.pinHash)) {
			const locked = recordFailure(me.id);
			if (locked) return fail(429, { message: lockMessage(locked) });
			return fail(400, { message: 'Code actuel incorrect.' });
		}

		const problem = newPinProblem(next);
		if (problem) return fail(400, { message: problem });
		if (next !== confirm) return fail(400, { message: 'Les deux nouveaux codes ne correspondent pas.' });
		if (next === current) return fail(400, { message: 'Choisis un code différent de l’actuel.' });

		setOwnPin(cookies, me.id, hashPin(next));
		if (me.mustChangePin) redirect(303, '/');
		return { done: true };
	}
};
