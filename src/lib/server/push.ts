// Web Push: subscriptions, and sending what the league has to say (`push-messages.ts`).
//
// Hidden entirely unless VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY are set (`npm run vapid`).
// Sending is fire-and-forget, AFTER the league's transaction has committed: a slow or failing
// push service never holds a write back or fails it; errors are logged, not thrown.
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { sendNotification, WebPushError } from 'web-push';
import { playerName } from '../format.ts';
import { isLocale, translator, type Locale } from '../i18n/index.ts';
import { pushMessage, recipients, type LeagueEvent } from '../push-messages.ts';
import { db, players, pushSubscriptions } from './db/index.ts';

export interface PushConfig {
	publicKey: string;
	privateKey: string;
	subject: string;
}

export function pushConfig(): PushConfig | null {
	const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
	const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
	if (!publicKey || !privateKey) return null;
	return { publicKey, privateKey, subject: process.env.VAPID_SUBJECT?.trim() || 'https://mate-moi.fly.dev' };
}

export interface NewSubscription {
	endpoint: string;
	keys: { p256dh: string; auth: string };
}

const BASE64URL = /^[A-Za-z0-9_-]+={0,2}$/;

/** What the browser posted, if it is a subscription we can use; else `null`. */
export function parseSubscription(body: unknown): NewSubscription | null {
	const b = body as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } } | null;
	const endpoint = b?.endpoint;
	const p256dh = b?.keys?.p256dh;
	const auth = b?.keys?.auth;
	if (typeof endpoint !== 'string' || endpoint.length > 2048 || !endpoint.startsWith('https://')) return null;
	for (const k of [p256dh, auth]) if (typeof k !== 'string' || k.length > 256 || !BASE64URL.test(k)) return null;
	return { endpoint, keys: { p256dh: p256dh as string, auth: auth as string } };
}

/** This browser now notifies `playerId`, in `locale` (a browser moving to another player moves too). */
export function saveSubscription(playerId: number, sub: NewSubscription, locale: Locale) {
	const row = { playerId, p256dh: sub.keys.p256dh, auth: sub.keys.auth, locale };
	db.insert(pushSubscriptions)
		.values({ endpoint: sub.endpoint, ...row })
		.onConflictDoUpdate({ target: pushSubscriptions.endpoint, set: row })
		.run();
}

export function deleteSubscription(playerId: number, endpoint: string) {
	db.delete(pushSubscriptions)
		.where(and(eq(pushSubscriptions.playerId, playerId), eq(pushSubscriptions.endpoint, endpoint)))
		.run();
}

/**
 * Tell the players concerned about `events`, once the transaction that caused them has committed
 * (call it after `db.transaction(…)` returns, never inside). Returns at once.
 */
export function notify(events: LeagueEvent[]) {
	const config = pushConfig();
	if (!config || !events.length) return;
	setImmediate(() => {
		send(config, events).catch((e) => console.error('push: sending failed', e));
	});
}

async function send(config: PushConfig, events: LeagueEvent[]) {
	const named = new Map(
		db
			.select({ id: players.id, name: players.name, deletedAt: players.deletedAt })
			.from(players)
			.all()
			.map((p) => [p.id, p])
	);
	const everyone = db
		.select({ id: players.id })
		.from(players)
		.where(and(eq(players.active, true), isNull(players.deletedAt)))
		.all()
		.map((p) => p.id);

	const sends: Promise<void>[] = [];
	for (const event of events) {
		const to = recipients(event);
		const ids = to === 'everyone' ? everyone : to;
		if (!ids.length) continue;
		const subs = db.select().from(pushSubscriptions).where(inArray(pushSubscriptions.playerId, ids)).all();
		for (const sub of subs) {
			const t = translator(isLocale(sub.locale) ? sub.locale : 'fr');
			const message = pushMessage(t, event, sub.playerId, (id) => playerName(t, named.get(id)));
			sends.push(
				sendNotification(
					{ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
					JSON.stringify(message),
					{ vapidDetails: config, TTL: 24 * 3600 }
				).then(
					() => undefined,
					(e: unknown) => {
						// Gone: the browser unsubscribed or the app was removed. Forget it.
						if (e instanceof WebPushError && (e.statusCode === 404 || e.statusCode === 410))
							db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id)).run();
						else console.error(`push: subscription ${sub.id} failed`, e instanceof Error ? e.message : e);
					}
				)
			);
		}
	}
	await Promise.all(sends);
}
