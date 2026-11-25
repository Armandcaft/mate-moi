<script lang="ts">
	import { enhance } from '$app/forms';
	import Crown from '#lib/components/Crown.svelte';
	import { SLOGAN_MAX } from '#lib/profile.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let slogan = $state('');
	$effect.pre(() => {
		slogan = data.slogan;
	});
	const left = $derived(SLOGAN_MAX - [...slogan.trim()].length);

	const field =
		'w-full rounded-xl border border-line bg-surface px-4 py-3 text-silver outline-none focus:border-gold';
	const keep = () => async ({ update }: { update: (o?: { reset?: boolean }) => Promise<void> }) =>
		update({ reset: false });
</script>

<svelte:head><title>Mon profil · Mate-Moi</title></svelte:head>

<div class="mx-auto max-w-sm pt-2">
	<div class="mb-7 text-center">
		<Crown size={40} class="mx-auto mb-3" />
		<h1 class="font-display text-2xl font-bold text-silver">{data.name}</h1>
		{#if data.slogan}
			<p class="mt-1 text-sm text-gold italic">« {data.slogan} »</p>
		{/if}
	</div>

	{#if form?.message}
		<p class="card mb-4 border-loss/60 px-4 py-3 text-center text-sm text-[#d27b7b]" role="alert">{form.message}</p>
	{:else if form?.saved}
		<p class="card mb-4 border-gold/50 px-4 py-3 text-center text-sm text-gold" role="status">
			{form.saved === 'name' ? 'Nom changé.' : form.value ? 'Devise enregistrée.' : 'Devise retirée.'}
		</p>
	{/if}

	<form method="POST" action="?/name" use:enhance={keep} class="card mb-4 p-4">
		<label class="block">
			<span class="mb-1.5 block text-sm text-muted">Mon nom</span>
			<input name="name" value={data.name} minlength="2" maxlength="24" required autocomplete="nickname" class={field} />
		</label>
		<p class="mt-2 text-xs text-muted">Il change partout, même dans l’historique.</p>
		<button class="btn btn-ghost mt-3 w-full">Changer mon nom</button>
	</form>

	<form method="POST" action="?/slogan" use:enhance={keep} class="card mb-4 p-4">
		<label class="block">
			<span class="mb-1.5 flex justify-between text-sm text-muted">
				<span>Ma devise</span>
				<span class="tabular-nums {left < 0 ? 'text-[#d27b7b]' : ''}">{left}</span>
			</span>
			<input
				name="slogan"
				bind:value={slogan}
				maxlength={SLOGAN_MAX + 10}
				placeholder="Je mate, donc je suis."
				class={field}
			/>
		</label>
		<p class="mt-2 text-xs text-muted">Affichée quand tu es couronné, et sur l’aperçu WhatsApp. Vide pour la retirer.</p>
		<button class="btn btn-ghost mt-3 w-full">Enregistrer ma devise</button>
	</form>

	<a href="/code" class="btn btn-ghost w-full">Changer mon code</a>
</div>
