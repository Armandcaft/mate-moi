import { error, fail } from '@sveltejs/kit';
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
	}
};
