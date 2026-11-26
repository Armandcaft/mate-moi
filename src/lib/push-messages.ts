// What the league tells players' phones (Web Push). Pure: `server/push.ts` sends these, after the
// league's transaction has committed, in each subscription's own language.
import { describe } from './format.ts';
import type { Translate } from './i18n/index.ts';
import type { Result } from './tournament/types.ts';

/** Something that happened in the league, worth a notification. */
export type LeagueEvent =
	/** A result was reported: the opponent must confirm it. */
	| { type: 'reported'; reporterId: number; whiteId: number; blackId: number; result: Result }
	/** A final game was created (round 2+ is the Armageddon decider of a drawn final). */
	| { type: 'final'; finalists: [number, number]; armageddon: boolean }
	| { type: 'king'; kingId: number; week: number }
	/** Nobody answered a reported result for 48 h: it counts. */
	| { type: 'autoConfirmed'; whiteId: number; blackId: number; result: Result };

export interface PushMessage {
	title: string;
	body: string;
	/** Where a tap on the notification leads. */
	url: string;
}

/** Who gets told: player ids, or every active player. */
export function recipients(event: LeagueEvent): number[] | 'everyone' {
	switch (event.type) {
		case 'reported':
			return [event.reporterId === event.whiteId ? event.blackId : event.whiteId];
		case 'final':
			return [...event.finalists];
		case 'king':
			return 'everyone';
		case 'autoConfirmed':
			return [event.whiteId, event.blackId];
	}
}

/** The notification `to` receives about `event`, in `t`'s language. */
export function pushMessage(t: Translate, event: LeagueEvent, to: number, name: (id: number) => string): PushMessage {
	const url = '/';
	switch (event.type) {
		case 'reported': {
			const result = describe(t, event.result, name(event.whiteId), name(event.blackId));
			return { title: t('push.reportedTitle'), body: t('push.reported', { name: name(event.reporterId), result }), url };
		}
		case 'final': {
			const other = event.finalists[0] === to ? event.finalists[1] : event.finalists[0];
			return {
				title: t('push.finalTitle'),
				body: t(event.armageddon ? 'push.armageddon' : 'push.final', { name: name(other) }),
				url
			};
		}
		case 'king':
			return { title: t('push.kingTitle'), body: t('preview.kingTitle', { name: name(event.kingId), n: event.week }), url };
		case 'autoConfirmed': {
			const [white, black] = [name(event.whiteId), name(event.blackId)];
			return {
				title: t('push.autoTitle'),
				body: t('push.auto', { game: `${white} – ${black}`, result: describe(t, event.result, white, black) }),
				url
			};
		}
	}
}
