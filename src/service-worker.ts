/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
// Push notifications only. No `fetch` handler and no cache, on purpose: a stale week would be
// worse than no page at all. SvelteKit registers this file itself.
const sw = self as unknown as ServiceWorkerGlobalScope;

sw.addEventListener('push', (event) => {
	let data: { title?: string; body?: string; url?: string } = {};
	try {
		data = event.data?.json() ?? {};
	} catch {
		data = { body: event.data?.text() };
	}
	event.waitUntil(
		sw.registration.showNotification(data.title ?? 'Mate-Moi', {
			body: data.body,
			icon: '/favicon.svg',
			data: { url: data.url ?? '/' }
		})
	);
});

sw.addEventListener('notificationclick', (event) => {
	event.notification.close();
	const url = new URL((event.notification.data?.url as string) ?? '/', sw.location.origin).href;
	event.waitUntil(
		(async () => {
			const open = await sw.clients.matchAll({ type: 'window', includeUncontrolled: true });
			const same = open.find((c) => new URL(c.url).origin === sw.location.origin);
			if (same) {
				await same.focus();
				if (same.url !== url) await same.navigate(url).catch(() => undefined);
				return;
			}
			await sw.clients.openWindow(url);
		})()
	);
});
