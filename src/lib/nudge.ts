// "Relancer": the WhatsApp message that reminds the group what the week is waiting for.
import type { Translate } from './i18n/index.ts';
import type { Result, Stage } from './tournament/types.ts';
import type { Step } from './tournament/progress.ts';

export interface NudgeGame {
	stage: Stage;
	whiteId: number;
	blackId: number;
	/** As reported; with no `confirmedAt` it waits for the opponent. */
	result: Result | null;
	reportedById: number | null;
	confirmedAt: Date | number | null;
}

export interface NudgeInput {
	weekNumber: number;
	phase: Step['phase'];
	games: NudgeGame[];
	name: (id: number) => string;
	/** The group stage's deadline, already in the sharer's words ("dimanche 23:59"), or none. */
	deadline?: string | null;
	/** The app, last: WhatsApp makes it a link. */
	link: string;
}

/** The stage whose games the week is waiting for in `phase`. */
const STAGE: Partial<Record<Step['phase'], Stage>> = { group: 'group', playoff: 'playoff', final: 'final' };

/** Count equal keys, keeping the order they first appear in. */
function tally(keys: string[]): [string, number][] {
	const counts = new Map<string, number>();
	for (const k of keys) counts.set(k, (counts.get(k) ?? 0) + 1);
	return [...counts];
}

const times = (n: number) => (n > 1 ? ` ×${n}` : '');

/**
 * In the sharer's language (`t`): the games still to play, grouped per pair with a count
 * (« Frank – Ryan ×2 »), the results waiting for confirmation and who must confirm them, the
 * deadline if there is one, then the link. Only the current stage: in a play-off or final, its games.
 */
export function nudgeText(t: Translate, input: NudgeInput): string {
	const stage = STAGE[input.phase];
	const open = input.games.filter((g) => g.stage === stage && !g.confirmedAt);
	const pair = (g: NudgeGame) =>
		[input.name(g.whiteId), input.name(g.blackId)].sort((a, b) => a.localeCompare(b)).join(' – ');

	const toPlay = tally(open.filter((g) => !g.result).map(pair));
	const toConfirm = tally(
		open
			.filter((g) => g.result)
			.map((g) => {
				const confirmer = g.reportedById === g.whiteId ? g.blackId : g.whiteId;
				return t('nudge.mustConfirm', { name: input.name(confirmer), game: pair(g) });
			})
	);

	const lines = [t('nudge.head', { week: t('week.label', { n: input.weekNumber }), phase: t(`phase.${input.phase}`) })];
	if (toPlay.length) lines.push('', t('nudge.toPlay'), ...toPlay.map(([p, n]) => `• ${p}${times(n)}`));
	if (toConfirm.length) lines.push('', t('nudge.toConfirm'), ...toConfirm.map(([p, n]) => `• ${p}${times(n)}`));
	if (!toPlay.length && !toConfirm.length) lines.push('', t('nudge.nothing'));
	if (input.deadline && input.phase === 'group') lines.push('', t('nudge.before', { when: input.deadline }));
	lines.push('', input.link);
	return lines.join('\n');
}
