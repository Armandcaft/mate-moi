<script lang="ts">
	import { enhance } from '$app/forms';
	import Crown from '#lib/components/Crown.svelte';
	import { t } from '#lib/i18n/t.svelte.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let busy = $state(false);

	const field =
		'w-full rounded-xl border border-line bg-surface px-4 py-3 text-center text-2xl tracking-[0.5em] text-silver outline-none focus:border-gold';
</script>

<svelte:head><title>{t('code.title')} · {t('app.short')}</title></svelte:head>

<div class="mx-auto max-w-sm pt-4">
	<div class="mb-7 text-center">
		<Crown size={40} class="mx-auto mb-3" />
		<h1 class="font-display text-2xl font-bold text-silver">
			{t(data.forced ? 'code.choose' : 'code.title')}
		</h1>
		<p class="mx-auto mt-2 max-w-xs text-sm text-muted">
			{t(data.forced ? 'code.forcedIntro' : 'code.intro')}
		</p>
	</div>

	{#if form?.done}
		<p class="card mb-5 border-gold/50 px-4 py-3 text-center text-sm text-gold" role="status">
			{t('code.done')}
		</p>
	{/if}

	<form
		method="POST"
		class="space-y-4"
		use:enhance={() => {
			busy = true;
			return async ({ update }) => {
				await update();
				busy = false;
			};
		}}
	>
		<label class="block">
			<span class="mb-1.5 block text-sm text-muted">{t(data.forced ? 'code.temporary' : 'code.current')}</span>
			<input name="current" type="password" inputmode="numeric" autocomplete="current-password" pattern="[0-9]*" maxlength="8" required class={field} />
		</label>
		<label class="block">
			<span class="mb-1.5 block text-sm text-muted">{t('code.next')}</span>
			<input name="next" type="password" inputmode="numeric" autocomplete="new-password" pattern="[0-9]*" minlength="6" maxlength="8" required class={field} />
		</label>
		<label class="block">
			<span class="mb-1.5 block text-sm text-muted">{t('code.again')}</span>
			<input name="confirm" type="password" inputmode="numeric" autocomplete="new-password" pattern="[0-9]*" minlength="6" maxlength="8" required class={field} />
		</label>

		{#if form?.message}
			<p class="text-center text-sm text-danger" role="alert">{form.message}</p>
		{/if}

		<button class="btn btn-gold w-full" disabled={busy}>{t('code.save')}</button>
	</form>

	{#if data.forced}
		<form method="POST" action="/logout" class="mt-6 text-center">
			<button class="text-xs text-muted hover:text-silver">{t('code.notMe')}</button>
		</form>
	{:else}
		<p class="mt-6 text-center text-xs text-muted">
			{t('code.forgot')}
		</p>
	{/if}
</div>
