import { translator } from '#lib/i18n/index.ts';
import { latestWeek, weekView } from '#lib/server/league.ts';
import { shareKey, standingsLine } from '#lib/server/og.ts';
import type { PageServerLoad } from './$types';

/**
 * The link posted in WhatsApp: public meta tags for the preview, then on to the app. WhatsApp
 * sends no cookies, so the sharer's language rides in the link (`?lang=`, read by the hook).
 */
export const load: PageServerLoad = ({ url, locals }) => {
	const t = translator(locals.locale);
	const week = latestWeek();
	const view = week ? weekView(week) : null;
	const step = view?.step;
	const title =
		step?.phase === 'done' && view
			? t('preview.kingTitle', { name: view.players.get(step.king)?.name ?? '?', n: view.week.number })
			: view
				? `${t('app.name')} · ${t('week.label', { n: view.week.number })}`
				: t('app.name');
	return {
		title,
		description: standingsLine(view, locals.locale),
		image: `${url.origin}/og/${shareKey(view)}.png?lang=${locals.locale}`
	};
};
