<script lang="ts">
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import Crown from '#lib/components/Crown.svelte';
	import LangSwitcher from '#lib/components/LangSwitcher.svelte';
	import ThemeSwitcher from '#lib/components/ThemeSwitcher.svelte';
	import { t } from '#lib/i18n/t.svelte.ts';
	import { SLOGAN_MAX } from '#lib/profile.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let slogan = $state('');
	$effect.pre(() => {
		slogan = data.slogan;
	});
	const left = $derived(SLOGAN_MAX - [...slogan.trim()].length);

	// ── Notifications ──
	type PushState = 'checking' | 'ios' | 'unsupported' | 'denied' | 'off' | 'on' | 'failed';
	let push = $state<PushState>('checking');
	let pushBusy = $state(false);

	/** The public key, base64url → bytes, as `subscribe` wants it. */
	function keyBytes(key: string) {
		const b64 = (key + '='.repeat((4 - (key.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
		return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
	}

	onMount(async () => {
		if (!data.vapidPublicKey) return;
		if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
			// iOS offers Web Push only to an app added to the Home Screen.
			const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));
			push = ios ? 'ios' : 'unsupported';
			return;
		}
		const reg = await navigator.serviceWorker.getRegistration();
		const sub = await reg?.pushManager.getSubscription();
		push = sub ? 'on' : (await permission()) === 'denied' ? 'denied' : 'off';
	});

	/** The Permissions API when there is one: `Notification.permission` can lag behind it. */
	async function permission(): Promise<NotificationPermission | PermissionState> {
		try {
			return (await navigator.permissions.query({ name: 'notifications' })).state;
		} catch {
			return Notification.permission;
		}
	}

	async function turnOn() {
		pushBusy = true;
		try {
			if ((await Notification.requestPermission()) !== 'granted') {
				push = 'denied';
				return;
			}
			const reg = await navigator.serviceWorker.ready;
			const sub = await reg.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: keyBytes(data.vapidPublicKey!)
			});
			const res = await fetch('/push', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(sub.toJSON())
			});
			if (!res.ok) throw new Error(`push: ${res.status}`);
			push = 'on';
		} catch (e) {
			console.error(e);
			push = 'failed';
		} finally {
			pushBusy = false;
		}
	}

	async function turnOff() {
		pushBusy = true;
		try {
			const reg = await navigator.serviceWorker.getRegistration();
			const sub = await reg?.pushManager.getSubscription();
			if (sub) {
				await fetch('/push/off', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ endpoint: sub.endpoint })
				});
				await sub.unsubscribe();
			}
			push = 'off';
		} finally {
			pushBusy = false;
		}
	}

	const field =
		'w-full rounded-xl border border-line bg-surface px-4 py-3 text-silver outline-none focus:border-gold';
	const keep = () => async ({ update }: { update: (o?: { reset?: boolean }) => Promise<void> }) =>
		update({ reset: false });
</script>

<svelte:head><title>{t('profile.title')} · {t('app.short')}</title></svelte:head>

<div class="mx-auto max-w-sm pt-2">
	<div class="mb-7 text-center">
		<Crown size={40} class="mx-auto mb-3" />
		<h1 class="font-display text-2xl font-bold text-silver">{data.name}</h1>
		{#if data.slogan}
			<p class="mt-1 text-sm text-gold italic">{t('common.quote', { text: data.slogan })}</p>
		{/if}
	</div>

	{#if form?.message}
		<p class="card mb-4 border-loss/60 px-4 py-3 text-center text-sm text-danger" role="alert">{form.message}</p>
	{:else if form?.saved}
		<p class="card mb-4 border-gold/50 px-4 py-3 text-center text-sm text-gold" role="status">
			{t(form.saved === 'name' ? 'profile.nameSaved' : form.value ? 'profile.sloganSaved' : 'profile.sloganRemoved')}
		</p>
	{/if}

	<form method="POST" action="?/name" use:enhance={keep} class="card mb-4 p-4">
		<label class="block">
			<span class="mb-1.5 block text-sm text-muted">{t('profile.name')}</span>
			<input name="name" value={data.name} minlength="2" maxlength="24" required autocomplete="nickname" class={field} />
		</label>
		<p class="mt-2 text-xs text-muted">{t('profile.nameHint')}</p>
		<button class="btn btn-ghost mt-3 w-full">{t('profile.changeName')}</button>
	</form>

	<form method="POST" action="?/slogan" use:enhance={keep} class="card mb-4 p-4">
		<label class="block">
			<span class="mb-1.5 flex justify-between text-sm text-muted">
				<span>{t('profile.slogan')}</span>
				<span class="tabular-nums {left < 0 ? 'text-danger' : ''}">{left}</span>
			</span>
			<input
				name="slogan"
				bind:value={slogan}
				maxlength={SLOGAN_MAX + 10}
				placeholder={t('profile.sloganPlaceholder')}
				class={field}
			/>
		</label>
		<p class="mt-2 text-xs text-muted">{t('profile.sloganHint')}</p>
		<button class="btn btn-ghost mt-3 w-full">{t('profile.saveSlogan')}</button>
	</form>

	<a href="/code" class="btn btn-ghost w-full">{t('profile.changeCode')}</a>

	{#if data.vapidPublicKey}
		<section class="card mt-4 p-4" data-push={push}>
			<h2 class="text-sm font-medium text-silver">{t('push.title')}</h2>
			<p class="mt-1 text-xs text-muted">{t('push.intro')}</p>
			{#if push === 'ios'}
				<p class="mt-3 text-sm text-silver">{t('push.ios')}</p>
			{:else if push === 'unsupported'}
				<p class="mt-3 text-sm text-muted">{t('push.unsupported')}</p>
			{:else if push === 'denied'}
				<p class="mt-3 text-sm text-danger">{t('push.denied')}</p>
			{:else if push === 'on'}
				<p class="mt-3 text-sm text-gold" role="status">{t('push.enabled')}</p>
				<button type="button" class="btn btn-ghost mt-3 w-full" disabled={pushBusy} onclick={turnOff}>{t('push.off')}</button>
			{:else if push !== 'checking'}
				{#if push === 'failed'}<p class="mt-3 text-sm text-danger" role="alert">{t('push.failed')}</p>{/if}
				<button type="button" class="btn btn-ghost mt-3 w-full" disabled={pushBusy} onclick={turnOn}>{t('push.on')}</button>
			{/if}
		</section>
	{/if}

	<div class="mt-8 text-center">
		<p class="mb-1 text-xs text-muted">{t('lang.label')}</p>
		<LangSwitcher />
		<p class="mt-4 mb-1 text-xs text-muted">{t('theme.label')}</p>
		<ThemeSwitcher />
	</div>

	<!-- Danger zone. A <details> is the confirmation step: it works without JS. -->
	<details class="card mt-10 border-loss/50 p-4" open={!!form?.deleteMessage}>
		<summary class="cursor-pointer list-none text-center text-sm font-semibold text-danger">{t('profile.deleteTitle')}</summary>
		<div class="mt-3 space-y-2 text-sm text-muted">
			<p>{t('profile.deleteIntro')}</p>
			<p>{t('profile.deleteWeek')}</p>
		</div>
		<form method="POST" action="?/delete" use:enhance class="mt-4">
			<label class="block">
				<span class="mb-1.5 block text-sm text-muted">{t('profile.deleteCode')}</span>
				<input
					name="pin"
					type="password"
					inputmode="numeric"
					autocomplete="current-password"
					pattern="[0-9]*"
					minlength="4"
					maxlength="8"
					required
					class="{field} text-center tracking-[0.5em]"
				/>
			</label>
			{#if form?.deleteMessage}
				<p class="mt-3 text-center text-sm text-danger" role="alert">{form.deleteMessage}</p>
			{/if}
			<button class="btn mt-3 w-full border border-danger/60 text-danger">{t('profile.deleteConfirm')}</button>
		</form>
	</details>
</div>
