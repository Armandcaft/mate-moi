import { hall, sweep } from '#lib/server/league.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	sweep();
	return hall();
};
