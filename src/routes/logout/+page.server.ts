import { redirect } from '@sveltejs/kit';
import { destroySession } from '#lib/server/auth.ts';
import type { Actions } from './$types';

export const load = () => redirect(303, '/');

export const actions: Actions = {
	default: ({ cookies }) => {
		destroySession(cookies);
		redirect(303, '/login');
	}
};
