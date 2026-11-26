<script lang="ts">
	import { enhance } from '$app/forms';
	import Crown from '#lib/components/Crown.svelte';
	import LangSwitcher from '#lib/components/LangSwitcher.svelte';
	import { t } from '#lib/i18n/t.svelte.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let busy = $state(false);

	const field =
		'w-full rounded-xl border border-line bg-surface px-4 py-3 text-silver outline-none focus:border-gold';
	const pinField = `${field} text-center text-2xl tracking-[0.5em]`;
</script>

<svelte:head>
	<title>{t('invite.title')} · {t('app.name')}</title>
	<meta property="og:title" content={t('invite.ogTitle')} />
	<meta property="og:description" content={t('invite.ogDescription')} />
	<meta property="og:image" content={data.image} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-sm pt-4">
	<div class="mb-7 text-center">
		<Crown size={44} class="mx-auto mb-3" />
		<h1 class="font-display text-2xl font-bold text-silver">{t('invite.heading')}</h1>
	</div>

	{#if data.signedIn}
		<p class="card px-5 py-6 text-center text-sm text-muted">
			{t('invite.signedIn')}
			<a href="/" class="mt-3 block text-gold">{t('invite.back')}</a>
		</p>
	{:else if !data.valid}
		<p class="card px-5 py-6 text-center text-sm text-muted">
			{t('invite.invalid')}
		</p>
	{:else}
		<p class="mb-6 text-center text-sm text-muted">
			{t('invite.intro')}
		</p>
		<form
			method="POST"
			class="space-y-4"
			use:enhance={() => {
				busy = true;
				return async ({ update }) => {
					await update({ reset: false });
					busy = false;
				};
			}}
		>
			<label class="block">
				<span class="mb-1.5 block text-sm text-muted">{t('invite.name')}</span>
				<input name="name" value={form?.name ?? ''} autocomplete="given-name" minlength="2" maxlength="24" required class={field} />
			</label>
			<label class="block">
				<span class="mb-1.5 block text-sm text-muted">{t('invite.pin')}</span>
				<input name="pin" type="password" inputmode="numeric" autocomplete="new-password" pattern="[0-9]*" minlength="6" maxlength="8" required class={pinField} />
			</label>
			<label class="block">
				<span class="mb-1.5 block text-sm text-muted">{t('invite.again')}</span>
				<input name="confirm" type="password" inputmode="numeric" autocomplete="new-password" pattern="[0-9]*" minlength="6" maxlength="8" required class={pinField} />
			</label>

			{#if form?.message}
				<p class="text-center text-sm text-danger" role="alert">{form.message}</p>
			{/if}

			<button class="btn btn-gold w-full" disabled={busy}>{t('invite.join')}</button>
		</form>
	{/if}

	<LangSwitcher class="mt-8" />
</div>
