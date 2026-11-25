import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => ({
	me: locals.player
		? {
				id: locals.player.id,
				name: locals.player.name,
				mustChangePin: locals.player.mustChangePin,
				isAdmin: locals.player.isAdmin
			}
		: null
});
