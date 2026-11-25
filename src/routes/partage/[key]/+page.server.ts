import { latestWeek, weekView } from '#lib/server/league.ts';
import { shareKey, standingsLine } from '#lib/server/og.ts';
import type { PageServerLoad } from './$types';

/** The link posted in WhatsApp: public meta tags for the preview, then on to the app. */
export const load: PageServerLoad = ({ url }) => {
	const week = latestWeek();
	const view = week ? weekView(week) : null;
	const step = view?.step;
	const title =
		step?.phase === 'done' && view
			? `♔ ${view.players.get(step.king)?.name} est le Roi de la Semaine ${view.week.number}`
			: view
				? `Mate-Moi si tu peux · Semaine ${view.week.number}`
				: 'Mate-Moi si tu peux';
	return {
		title,
		description: standingsLine(view),
		image: `${url.origin}/og/${shareKey(view)}.png`
	};
};
