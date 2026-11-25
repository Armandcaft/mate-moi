import { latestWeek, weekView } from '#lib/server/league.ts';
import { standingsPng } from '#lib/server/og.ts';

/**
 * The preview image of the current week. Public: WhatsApp fetches it without a session.
 * `key` is only there to make each state's URL unique; the image is always the latest week.
 */
export const GET = async () => {
	const week = latestWeek();
	const png = await standingsPng(week ? weekView(week) : null);
	return new Response(new Uint8Array(png), {
		headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=300' }
	});
};
