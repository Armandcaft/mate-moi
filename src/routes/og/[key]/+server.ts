import { latestWeek, sweep, weekView } from '#lib/server/league.ts';
import { standingsPng } from '#lib/server/og.ts';

/**
 * The preview image of the current week. Public: WhatsApp fetches it without a session.
 * `key` is only there to make each state's URL unique; the image is always the latest week.
 */
export const GET = async ({ locals }) => {
	sweep();
	const week = latestWeek();
	// The language comes from `?lang=` (the hook; French without it): WhatsApp sends no cookies.
	const png = await standingsPng(week ? weekView(week) : null, locals.locale);
	return new Response(new Uint8Array(png), {
		headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=300' }
	});
};
