<script lang="ts">
	import { enhance } from '$app/forms';
	import { whatsapp } from '#lib/format.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const when = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
	const locked = (p: { lockedUntil: Date | null }) => !!p.lockedUntil && p.lockedUntil.getTime() > Date.now();
	const nameOf = (id: unknown) => data.players.find((p) => p.id === id)?.name ?? '';

	let copied = $state(false);
	async function copy(text: string) {
		try {
			await navigator.clipboard.writeText(text);
			copied = true;
			setTimeout(() => (copied = false), 1800);
		} catch {
			/* the link stays visible to copy by hand */
		}
	}

	const inviteMessage = (link: string) =>
		`♔ Tu es invité à rejoindre « Mate-Moi si tu peux », notre tournoi d’échecs de la semaine.\n` +
		`Choisis ton nom et ton code ici (lien valable 48 h, une seule fois) :\n${link}`;
</script>

<svelte:head><title>Admin · Mate-Moi</title></svelte:head>

<h1 class="font-display mb-5 text-2xl font-bold text-silver">Admin</h1>

{#if form?.message}
	<p class="card mb-4 border-loss/60 px-4 py-3 text-sm text-[#d27b7b]" role="alert">{form.message}</p>
{/if}

<!-- Invitations -->
<section class="mb-8">
	<h2 class="mb-3 text-xs tracking-[0.2em] text-muted uppercase">Inviter un joueur</h2>

	{#if form?.inviteLink}
		<div class="card mb-3 border-gold/50 p-4">
			<p class="mb-2 text-sm text-silver">Lien prêt. Il sert une seule fois, pendant 48 h :</p>
			<p class="mb-3 rounded-lg bg-board px-3 py-2 font-mono text-xs break-all text-muted">{form.inviteLink}</p>
			<div class="grid grid-cols-2 gap-2">
				<button type="button" class="btn btn-ghost" onclick={() => copy(form.inviteLink as string)}>
					{copied ? 'Copié ✓' : 'Copier'}
				</button>
				<a class="btn btn-gold" href={whatsapp(inviteMessage(form.inviteLink as string))} target="_blank" rel="noopener">
					Envoyer
				</a>
			</div>
			<p class="mt-3 text-xs text-muted">
				Pendant la phase de groupes, il entre dans la semaine en cours : ses parties contre chacun
				s’ajoutent. Après, il commence la semaine suivante.
			</p>
		</div>
	{:else}
		<form method="POST" action="?/invite" use:enhance>
			<button class="btn btn-gold w-full">Créer un lien d’invitation</button>
		</form>
	{/if}

	{#if data.invites.length}
		<div class="card mt-3 divide-y divide-line/60">
			{#each data.invites as inv (inv.id)}
				<form method="POST" action="?/revoke" use:enhance class="flex items-center justify-between gap-3 px-4 py-3 text-sm">
					<input type="hidden" name="invite" value={inv.id} />
					<span class="text-muted">Lien de {inv.by} · expire {when.format(inv.expiresAt)}</span>
					<button class="text-xs text-[#d27b7b] hover:underline">Annuler</button>
				</form>
			{/each}
		</div>
	{/if}
</section>

<!-- Players -->
<section class="mb-8">
	<h2 class="mb-3 text-xs tracking-[0.2em] text-muted uppercase">Joueurs</h2>

	{#if form?.tempPin}
		<div class="card mb-3 border-gold/50 p-4 text-sm" role="status">
			<p class="text-silver">Code provisoire de {nameOf(form.tempFor)} :</p>
			<p class="font-display my-2 text-center text-3xl tracking-[0.3em] text-gold">{form.tempPin}</p>
			<p class="text-xs text-muted">Envoie-le-lui en privé : il choisira le sien à la connexion. Il ne sera plus affiché.</p>
		</div>
	{/if}

	<div class="grid gap-2">
		{#each data.players as p (p.id)}
			{@const me = p.id === data.me?.id}
			<details class="card group {p.active ? '' : 'opacity-60'}">
				<summary class="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3">
					<span class="font-medium text-silver">{p.name}{me ? ' (toi)' : ''}</span>
					<span class="flex flex-wrap justify-end gap-1 text-[10px] tracking-wider uppercase">
						{#if p.isAdmin}<span class="rounded-full border border-gold/50 px-2 py-0.5 text-gold">Admin</span>{/if}
						{#if !p.active}<span class="rounded-full border border-line px-2 py-0.5 text-muted">Inactif</span>{/if}
						{#if p.mustChangePin}<span class="rounded-full border border-line px-2 py-0.5 text-muted">Code provisoire</span>{/if}
						{#if locked(p)}<span class="rounded-full border border-loss/60 px-2 py-0.5 text-[#d27b7b]">Bloqué</span>{/if}
					</span>
				</summary>
				<form method="POST" use:enhance class="grid grid-cols-2 gap-2 border-t border-line px-4 py-3">
					<input type="hidden" name="player" value={p.id} />
					<button formaction="?/reset" class="btn btn-ghost text-xs">Nouveau code provisoire</button>
					{#if !me}
						{#if p.active}
							<button formaction="?/deactivate" class="btn btn-ghost text-xs">Désactiver</button>
						{:else}
							<button formaction="?/activate" class="btn btn-ghost text-xs">Réactiver</button>
						{/if}
						{#if p.isAdmin}
							<button formaction="?/demote" class="btn btn-ghost text-xs">Retirer admin</button>
						{:else}
							<button formaction="?/promote" class="btn btn-ghost text-xs">Nommer admin</button>
						{/if}
					{/if}
				</form>
			</details>
		{/each}
	</div>
	<p class="mt-2 text-xs text-muted">
		Un joueur désactivé est déconnecté, garde son historique et n’entre plus dans les nouvelles semaines.
	</p>
</section>

<!-- Backup -->
<section>
	<h2 class="mb-3 text-xs tracking-[0.2em] text-muted uppercase">Sauvegarde</h2>
	<a href="/admin/sauvegarde" class="btn btn-ghost w-full" data-sveltekit-reload>Télécharger toute la ligue (.db)</a>
	<p class="mt-2 text-xs text-muted">
		Un seul fichier : joueurs, parties, rois. À garder privé. Pour le restaurer ou changer de serveur, voir le README.
	</p>
</section>
