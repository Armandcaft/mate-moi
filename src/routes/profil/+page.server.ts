import { error, fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { AccountError, deleteAccount, isLastAdmin } from '#lib/server/accounts.ts';
import { SESSION_COOKIE, lockMessage, lockedFor, recordFailure } from '#lib/server/auth.ts';
import { db, players } from '#lib/server/db/index.ts';
import { verifyPin } from '#lib/server/pin.ts';
import { ProfileError, rename, setSlogan } from '#lib/server/profile.ts';
import { say, type Locale } from '#lib/i18n/index.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => ({
	name: locals.player!.name,
	slogan: locals.player!.slogan ?? ''
});

async function attempt(locale: Locale, fn: () => Record<string, unknown>) {
	try {
		return fn();
	} catch (e) {
		if (e instanceof ProfileError) return fail(400, { message: say(locale, e) });
		throw e;
	}
}

export const actions: Actions = {
	name: async ({ request, locals }) => {
		if (!locals.player) error(401);
		const raw = String((await request.formData()).get('name') ?? '');
		return attempt(locals.locale, () => ({ saved: 'name', value: rename(locals.player!.id, raw) }));
	},
	slogan: async ({ request, locals }) => {
		if (!locals.player) error(401);
		const raw = String((await request.formData()).get('slogan') ?? '');
		return attempt(locals.locale, () => ({ saved: 'slogan', value: setSlogan(locals.player!.id, raw) }));
	},
	/**
	 * Delete my own account, after my current code: the same lockout as the login, so an open
	 * session left on a phone cannot be used to guess it.
	 */
	delete: async ({ request, locals, cookies }) => {
		if (!locals.player) error(401);
		const me = db.select().from(players).where(eq(players.id, locals.player.id)).get()!;
		const pin = String((await request.formData()).get('pin') ?? '');
		const refuse = (status: number, message: string) => fail(status, { deleteMessage: message });

		const wait = lockedFor(me);
		if (wait > 0) return refuse(429, say(locals.locale, lockMessage(wait)));
		if (!verifyPin(pin, me.pinHash)) {
			const locked = recordFailure(me.id);
			if (locked) return refuse(429, say(locals.locale, lockMessage(locked)));
			return refuse(400, say(locals.locale, { key: 'login.wrongCode' }));
		}
		// Someone must still be able to invite, reset codes and download backups.
		if (isLastAdmin(me.id)) return refuse(400, say(locals.locale, { key: 'profile.lastAdmin' }));

		try {
			deleteAccount(me.id);
		} catch (e) {
			if (e instanceof AccountError) return refuse(400, say(locals.locale, e));
			throw e;
		}
		// The sessions are gone with the account; the cookie goes too.
		cookies.delete(SESSION_COOKIE, { path: '/' });
		redirect(303, '/login?bye');
	}
};
