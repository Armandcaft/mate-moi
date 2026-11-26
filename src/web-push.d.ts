// web-push 4 ships no types: the little this app uses (`server/push.ts`, `scripts/vapid.ts`).
declare module 'web-push' {
	export interface PushSubscription {
		endpoint: string;
		keys: { p256dh: string; auth: string };
	}
	export interface SendOptions {
		vapidDetails?: { subject: string; publicKey: string; privateKey: string };
		TTL?: number;
		urgency?: 'very-low' | 'low' | 'normal' | 'high';
	}
	export class WebPushError extends Error {
		statusCode: number;
		body: string;
		endpoint: string;
	}
	export function sendNotification(
		subscription: PushSubscription,
		payload?: string | Buffer | null,
		options?: SendOptions
	): Promise<{ statusCode: number; body: string }>;
	export function generateVAPIDKeys(): { publicKey: string; privateKey: string };
}
