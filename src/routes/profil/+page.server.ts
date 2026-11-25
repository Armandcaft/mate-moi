import { error, fail } from '@sveltejs/kit';
import { ProfileError, rename, setSlogan } from '#lib/server/profile.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => ({
	name: locals.player!.name,
	slogan: locals.player!.slogan ?? ''
});

async function attempt(fn: () => Record<string, unknown>) {
	try {
		return fn();
	} catch (e) {
		if (e instanceof ProfileError) return fail(400, { message: e.message });
		throw e;
	}
}

export const actions: Actions = {
	name: async ({ request, locals }) => {
		if (!locals.player) error(401);
		const raw = String((await request.formData()).get('name') ?? '');
		return attempt(() => ({ saved: 'name', value: rename(locals.player!.id, raw) }));
	},
	slogan: async ({ request, locals }) => {
		if (!locals.player) error(401);
		const raw = String((await request.formData()).get('slogan') ?? '');
		return attempt(() => ({ saved: 'slogan', value: setSlogan(locals.player!.id, raw) }));
	}
};
