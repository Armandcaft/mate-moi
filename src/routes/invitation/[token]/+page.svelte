<script lang="ts">
	import { enhance } from '$app/forms';
	import Crown from '#lib/components/Crown.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let busy = $state(false);

	const field =
		'w-full rounded-xl border border-line bg-surface px-4 py-3 text-silver outline-none focus:border-gold';
	const pinField = `${field} text-center text-2xl tracking-[0.5em]`;
</script>

<svelte:head>
	<title>Invitation · Mate-Moi si tu peux</title>
	<meta property="og:title" content="♔ Tu es invité à Mate-Moi si tu peux" />
	<meta property="og:description" content="Le tournoi d’échecs de la semaine, entre amis. Choisis ton nom et ton code." />
	<meta property="og:image" content={data.image} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-sm pt-4">
	<div class="mb-7 text-center">
		<Crown size={44} class="mx-auto mb-3" />
		<h1 class="font-display text-2xl font-bold text-silver">Bienvenue à la cour</h1>
	</div>

	{#if data.signedIn}
		<p class="card px-5 py-6 text-center text-sm text-muted">
			Tu es déjà connecté. Cette invitation est pour un nouveau joueur : transmets-lui le lien.
			<a href="/" class="mt-3 block text-gold">Retour à la semaine</a>
		</p>
	{:else if !data.valid}
		<p class="card px-5 py-6 text-center text-sm text-muted">
			Cette invitation a expiré ou a déjà servi. Demande un nouveau lien à un admin.
		</p>
	{:else}
		<p class="mb-6 text-center text-sm text-muted">
			Chacun affronte chacun, une finale, un Roi par semaine. Si la phase de groupes
			de la semaine est en cours, tu y entres tout de suite.
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
				<span class="mb-1.5 block text-sm text-muted">Ton nom (tel que les autres le verront)</span>
				<input name="name" value={form?.name ?? ''} autocomplete="given-name" minlength="2" maxlength="24" required class={field} />
			</label>
			<label class="block">
				<span class="mb-1.5 block text-sm text-muted">Ton code · 6 à 8 chiffres</span>
				<input name="pin" type="password" inputmode="numeric" autocomplete="new-password" pattern="[0-9]*" minlength="6" maxlength="8" required class={pinField} />
			</label>
			<label class="block">
				<span class="mb-1.5 block text-sm text-muted">Encore une fois</span>
				<input name="confirm" type="password" inputmode="numeric" autocomplete="new-password" pattern="[0-9]*" minlength="6" maxlength="8" required class={pinField} />
			</label>

			{#if form?.message}
				<p class="text-center text-sm text-[#d27b7b]" role="alert">{form.message}</p>
			{/if}

			<button class="btn btn-gold w-full" disabled={busy}>Rejoindre la ligue</button>
		</form>
	{/if}
</div>
