import { hall } from '#lib/server/league.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => hall();
