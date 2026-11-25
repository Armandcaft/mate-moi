import { error, fail } from '@sveltejs/kit';
import {
	LeagueError,
	confirmResult,
	latestWeek,
	rejectResult,
	reportResult,
	startWeek,
	weekView
} from '#lib/server/league.ts';
import { say, type Locale } from '#lib/i18n/index.ts';
import { shareKey } from '#lib/server/og.ts';
import type { Result } from '#lib/tournament/types.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const week = latestWeek();
	const view = week ? weekView(week) : null;
	return { view, shareKey: shareKey(view) };
};

const RESULTS: Result[] = ['1-0', '0-1', '1/2-1/2'];

/** Run a league write, turning its refusals into a form error the page shows. */
function attempt(locale: Locale, fn: () => void) {
	try {
		fn();
	} catch (e) {
		if (e instanceof LeagueError) return fail(400, { message: say(locale, e) });
		throw e;
	}
}

async function readGameForm(request: Request) {
	const form = await request.formData();
	return { id: Number(form.get('game')), result: String(form.get('result')) as Result };
}

export const actions: Actions = {
	start: ({ locals }) => {
		if (!locals.player) error(401);
		return attempt(locals.locale, () => startWeek());
	},
	report: async ({ request, locals }) => {
		if (!locals.player) error(401);
		const { id, result } = await readGameForm(request);
		if (!RESULTS.includes(result)) return fail(400, { message: say(locals.locale, { key: 'league.unknownResult' }) });
		return attempt(locals.locale, () => reportResult(id, locals.player!.id, result));
	},
	confirm: async ({ request, locals }) => {
		if (!locals.player) error(401);
		const { id } = await readGameForm(request);
		return attempt(locals.locale, () => confirmResult(id, locals.player!.id));
	},
	reject: async ({ request, locals }) => {
		if (!locals.player) error(401);
		const { id } = await readGameForm(request);
		return attempt(locals.locale, () => rejectResult(id, locals.player!.id));
	}
};
