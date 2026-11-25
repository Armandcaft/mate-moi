<script lang="ts">
	import { enhance } from '$app/forms';
	import Crown from '#lib/components/Crown.svelte';
	import LangSwitcher from '#lib/components/LangSwitcher.svelte';
	import { t } from '#lib/i18n/t.svelte.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let selected = $derived<number | null>(form?.playerId ?? null);
	let busy = $state(false);
</script>

<svelte:head><title>{t('login.title')} · {t('app.short')}</title></svelte:head>

<div class="mx-auto max-w-sm pt-6">
	<div class="mb-8 text-center">
		<Crown size={44} class="mx-auto mb-3" />
		<h1 class="font-display text-2xl font-bold text-silver">{t('login.heading')}</h1>
		<p class="mt-1 text-sm text-muted">{t('login.intro')}</p>
	</div>

	{#if data.players.length === 0}
		<p class="card p-5 text-center text-sm text-muted">
			{t('login.noPlayers')} <code class="text-silver">npm run player -- add</code>.
		</p>
	{:else}
		<form
			method="POST"
			class="space-y-5"
			use:enhance={() => {
				busy = true;
				return async ({ update }) => {
					await update({ reset: false });
					busy = false;
				};
			}}
		>
			<fieldset class="grid gap-2">
				<legend class="sr-only">{t('table.player')}</legend>
				{#each data.players as p (p.id)}
					<label
						class="card flex cursor-pointer items-center justify-between px-4 py-3.5 transition-colors has-[:checked]:border-gold has-[:checked]:bg-raised"
					>
						<span class="min-w-0">
							<span class="block font-medium">{p.name}</span>
							{#if p.slogan}<span class="block truncate text-xs text-muted italic">{t('common.quote', { text: p.slogan })}</span>{/if}
						</span>
						<input type="radio" name="player" value={p.id} bind:group={selected} class="accent-[#C9A24A]" required />
					</label>
				{/each}
			</fieldset>

			<label class="block">
				<span class="mb-1.5 block text-sm text-muted">{t('login.code')}</span>
				<input
					name="pin"
					type="password"
					inputmode="numeric"
					autocomplete="current-password"
					pattern="[0-9]*"
					minlength="4"
					maxlength="8"
					required
					class="w-full rounded-xl border border-line bg-surface px-4 py-3 text-center text-2xl tracking-[0.6em] text-silver outline-none focus:border-gold"
				/>
			</label>

			{#if form?.message}
				<p class="text-center text-sm text-[#d27b7b]" role="alert">{form.message}</p>
			{/if}

			<button class="btn btn-gold w-full" disabled={busy || selected === null}>{t('login.submit')}</button>
		</form>
	{/if}

	<LangSwitcher class="mt-8" />
</div>
