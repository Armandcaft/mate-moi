<script lang="ts">
	import { enhance } from '$app/forms';
	import Crown from '#lib/components/Crown.svelte';
	import GameCard from '#lib/components/GameCard.svelte';
	import { PHASE_LABEL, whatsapp } from '#lib/format.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const view = $derived(data.view);
	const me = $derived(data.me!);
	const name = (id: number) => view?.players.get(id)?.name ?? '?';
	const open = $derived(!!view && !view.week.closedAt);
	const step = $derived(view?.step);

	const groupGames = $derived(view?.games.filter((g) => g.stage === 'group') ?? []);
	const played = $derived(groupGames.filter((g) => g.confirmedAt).length);
	const knockout = $derived(view?.games.filter((g) => g.stage !== 'group') ?? []);

	/** My games that need something from me: to play, or a result to confirm. */
	const todo = $derived(
		open && view
			? view.games.filter(
					(g) =>
						!g.confirmedAt &&
						(g.whiteId === me.id || g.blackId === me.id) &&
						(!g.result || g.reportedById !== me.id)
				)
			: []
	);
	const todoIds = $derived(new Set(todo.map((g) => g.id)));

	const shareText = $derived.by(() => {
		if (!view) return '';
		const head =
			step?.phase === 'done'
				? `♔ ${name(step.king)} est le Roi de la Semaine ${view.week.number} ! Qui ose le détrôner ?`
				: `♔ Mate-Moi si tu peux · Semaine ${view.week.number} · ${PHASE_LABEL[step!.phase]}`;
		const lines = view.standings.map((l) => `${l.rank}. ${name(l.playerId)}  ${l.points} pts`);
		return [head, '', ...lines].join('\n');
	});

	let starting = $state(false);
</script>

<svelte:head><title>Semaine {view?.week.number ?? ''} · Mate-Moi</title></svelte:head>

{#if form?.message}
	<p class="card mb-4 border-loss/60 px-4 py-3 text-sm text-[#d27b7b]" role="alert">{form.message}</p>
{/if}

{#snippet startButton(label: string)}
	<form
		method="POST"
		action="?/start"
		use:enhance={() => {
			starting = true;
			return async ({ update }) => {
				await update();
				starting = false;
			};
		}}
	>
		<button class="btn btn-gold w-full" disabled={starting}>{label}</button>
	</form>
{/snippet}

{#if !view}
	<section class="card px-6 py-10 text-center">
		<Crown size={48} class="mx-auto mb-4" />
		<h1 class="font-display text-2xl font-bold text-silver">Le trône est vide.</h1>
		<p class="mx-auto mt-2 mb-6 max-w-xs text-sm text-muted">
			Trois parties contre chaque adversaire, puis une finale entre les deux meilleurs.
		</p>
		{@render startButton('Lancer la semaine 1')}
	</section>
{:else}
	<div class="mb-5 flex items-end justify-between">
		<div>
			<p class="text-xs tracking-[0.2em] text-muted uppercase">Semaine {view.week.number}</p>
			<h1 class="font-display text-2xl font-bold text-silver">{PHASE_LABEL[step!.phase]}</h1>
		</div>
		{#if step?.phase === 'group'}
			<p class="text-sm text-muted tabular-nums">{played} / {groupGames.length} parties</p>
		{/if}
	</div>

	{#if step?.phase === 'done'}
		<section class="king-reveal card relative mb-5 overflow-hidden border-gold/50 px-6 py-8 text-center">
			<div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,162,74,0.22),transparent_65%)]"></div>
			<div class="crown-drop relative"><Crown size={56} class="mx-auto mb-3" /></div>
			<p class="relative text-xs tracking-[0.25em] text-gold uppercase">Roi de la Semaine {view.week.number}</p>
			<p class="font-display text-gold-gradient relative mt-1 text-4xl font-bold">{name(step.king)}</p>
		</section>
	{:else if step?.phase === 'playoff'}
		<section class="card mb-5 border-gold/30 px-4 py-3 text-sm">
			<span class="text-gold">Égalité.</span>
			{step.contenders.map(name).join(', ')} se départagent en Armageddon (la nulle compte pour les Noirs).
		</section>
	{:else if step?.phase === 'final'}
		<section class="card mb-5 border-gold/30 px-4 py-4 text-center">
			<p class="text-xs tracking-[0.2em] text-gold uppercase">Pour la couronne</p>
			<p class="font-display mt-1 text-xl font-bold text-silver">
				{name(step.finalists[0])} <span class="text-muted">vs</span> {name(step.finalists[1])}
			</p>
		</section>
	{/if}

	<!-- Standings -->
	<section class="card mb-6 overflow-hidden">
		<table class="w-full text-sm tabular-nums">
			<thead class="text-[11px] tracking-wider text-muted uppercase">
				<tr class="border-b border-line">
					<th class="py-2.5 pl-4 text-left font-medium">#</th>
					<th class="py-2.5 text-left font-medium">Joueur</th>
					<th class="py-2.5 text-center font-medium" title="Parties jouées">J</th>
					<th class="py-2.5 text-center font-medium" title="Victoires">V</th>
					<th class="py-2.5 text-center font-medium" title="Nulles">N</th>
					<th class="py-2.5 text-center font-medium" title="Défaites">D</th>
					<th class="py-2.5 pr-4 text-right font-medium">Pts</th>
				</tr>
			</thead>
			<tbody>
				{#each view.standings as line (line.playerId)}
					{@const leader = step?.phase === 'done' ? step.king === line.playerId : line.rank === 1 && line.points > 0}
					<tr class="border-b border-line/60 last:border-0 {line.playerId === me.id ? 'bg-raised/60' : ''}">
						<td class="py-3 pl-4 text-muted">{line.rank}</td>
						<td class="py-3 font-medium {leader ? 'text-gold' : 'text-silver'}">
							<span class="inline-flex items-center gap-1.5">
								{name(line.playerId)}
								{#if step?.phase === 'done' && step.king === line.playerId}<Crown size={14} />{/if}
							</span>
						</td>
						<td class="py-3 text-center text-muted">{line.played}</td>
						<td class="py-3 text-center">{line.wins}</td>
						<td class="py-3 text-center">{line.draws}</td>
						<td class="py-3 text-center">{line.losses}</td>
						<td class="py-3 pr-4 text-right text-base font-semibold {leader ? 'text-gold' : 'text-silver'}">{line.points}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</section>

	<div class="mb-8 grid gap-2 {step?.phase === 'done' ? 'grid-cols-2' : ''}">
		<a href={whatsapp(shareText)} target="_blank" rel="noopener" class="btn btn-ghost">
			{step?.phase === 'done' ? 'Partager' : 'Partager sur WhatsApp'}
		</a>
		{#if step?.phase === 'done'}
			{@render startButton(`Semaine ${view.week.number + 1}`)}
		{/if}
	</div>

	{#if todo.length}
		<section class="mb-8">
			<h2 class="mb-3 text-xs tracking-[0.2em] text-gold uppercase">À toi de jouer</h2>
			<div class="grid gap-3">
				{#each todo as game (game.id)}
					<GameCard {game} names={view.players} meId={me.id} {open} />
				{/each}
			</div>
		</section>
	{/if}

	{#if knockout.length}
		<section class="mb-8">
			<h2 class="mb-3 text-xs tracking-[0.2em] text-muted uppercase">Barrage et finale</h2>
			<div class="grid gap-3">
				{#each knockout.filter((g) => !todoIds.has(g.id)) as game (game.id)}
					<GameCard {game} names={view.players} meId={me.id} {open} />
				{/each}
			</div>
		</section>
	{/if}

	<section>
		<h2 class="mb-3 text-xs tracking-[0.2em] text-muted uppercase">Phase de groupes</h2>
		<div class="grid gap-3">
			{#each groupGames.filter((g) => !todoIds.has(g.id)) as game (game.id)}
				<GameCard {game} names={view.players} meId={me.id} {open} />
			{/each}
		</div>
	</section>
{/if}

<style>
	.crown-drop {
		animation: drop 900ms cubic-bezier(0.2, 0.9, 0.25, 1.15) both;
	}
	.king-reveal {
		animation: glow 1600ms ease-out both;
	}
	@keyframes drop {
		from {
			transform: translateY(-28px) rotate(-8deg);
			opacity: 0;
		}
	}
	@keyframes glow {
		from {
			box-shadow: 0 0 0 0 rgba(201, 162, 74, 0.45);
		}
		to {
			box-shadow: 0 0 60px -20px rgba(201, 162, 74, 0.35);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.crown-drop,
		.king-reveal {
			animation: none;
		}
	}
</style>
