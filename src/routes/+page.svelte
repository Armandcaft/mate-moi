<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import Crown from '#lib/components/Crown.svelte';
	import GameCard from '#lib/components/GameCard.svelte';
	import { playerName, whatsapp } from '#lib/format.ts';
	import { locale, t } from '#lib/i18n/t.svelte.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const view = $derived(data.view);
	const me = $derived(data.me!);
	const name = (id: number) => playerName(t, view?.players.get(id));
	const open = $derived(!!view && !view.week.closedAt);
	const step = $derived(view?.step);
	/** Over: crowned, or called off for want of players. The next week can start. */
	const over = $derived(step?.phase === 'done' || step?.phase === 'abandoned');

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
				? t('week.shareKing', { name: name(step.king), n: view.week.number })
				: `♔ ${t('app.name')} · ${t('week.label', { n: view.week.number })} · ${t(`phase.${step!.phase}`)}`;
		const lines = view.standings.map((l) => `${l.rank}. ${name(l.playerId)}  ${t('common.pts', { n: l.points })}`);
		// The link last: WhatsApp previews it with the standings image (/partage → /og), in the
		// sharer's language (WhatsApp sends no cookies, so it rides in the link).
		const link = `${page.url.origin}/partage/${data.shareKey}?lang=${locale()}`;
		return [head, '', ...lines, '', link].join('\n');
	});

	let starting = $state(false);
	/** Just joined through an invitation, straight into this week's group stage. */
	const welcome = $derived(page.url.searchParams.has('bienvenue') && !!view?.players.has(me.id));
	/** Joined after this week's group stage: playing from the next one. */
	const benched = $derived(!!view && !view.week.closedAt && !view.players.has(me.id));
</script>

<svelte:head><title>{t('week.label', { n: view?.week.number ?? '' })} · {t('app.short')}</title></svelte:head>

{#if benched}
	<p class="card mb-4 border-gold/40 px-4 py-3 text-sm text-silver" role="status">
		<span class="text-gold">{t('week.welcome', { name: me.name })}</span>
		{t('week.benched')}
	</p>
{:else if welcome}
	<p class="card mb-4 border-gold/40 px-4 py-3 text-sm text-silver" role="status">
		<span class="text-gold">{t('week.welcome', { name: me.name })}</span>
		{t('week.joined', { n: todo.length })}
	</p>
{/if}

{#if form?.message}
	<p class="card mb-4 border-loss/60 px-4 py-3 text-sm text-danger" role="alert">{form.message}</p>
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
		<h1 class="font-display text-2xl font-bold text-silver">{t('week.emptyThrone')}</h1>
		<p class="mx-auto mt-2 mb-6 max-w-xs text-sm text-muted">
			{t('week.rules')}
		</p>
		{@render startButton(t('week.start', { n: 1 }))}
	</section>
{:else}
	<div class="mb-5 flex items-end justify-between">
		<div>
			<p class="text-xs tracking-[0.2em] text-muted uppercase">{t('week.label', { n: view.week.number })}</p>
			<h1 class="font-display text-2xl font-bold text-silver">{t(`phase.${step!.phase}`)}</h1>
		</div>
		{#if step?.phase === 'group'}
			<div class="text-right whitespace-nowrap">
				<p class="text-sm text-muted tabular-nums">{t('week.progress', { played, n: groupGames.length })}</p>
				<p class="text-xs text-muted/80">{t('week.perOpponent', { n: view.gamesPerPair })}</p>
			</div>
		{/if}
	</div>

	{#if step?.phase === 'done'}
		<section class="king-reveal card relative mb-5 overflow-hidden border-gold/50 px-6 py-8 text-center">
			<div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--color-gold)_22%,transparent),transparent_65%)]"></div>
			<div class="crown-drop relative"><Crown size={56} class="mx-auto mb-3" /></div>
			<p class="relative text-xs tracking-[0.25em] text-gold uppercase">{t('week.king', { n: view.week.number })}</p>
			<p class="font-display text-gold-gradient relative mt-1 text-4xl font-bold">{name(step.king)}</p>
			{#if view.players.get(step.king)?.slogan}
				<p class="relative mt-2 text-sm text-silver/90 italic">{t('common.quote', { text: view.players.get(step.king)?.slogan ?? '' })}</p>
			{/if}
		</section>
	{:else if step?.phase === 'abandoned'}
		<section class="card mb-5 px-4 py-4 text-center text-sm text-muted" role="status">
			{t('week.abandoned')}
		</section>
	{:else if step?.phase === 'playoff'}
		<section class="card mb-5 border-gold/30 px-4 py-3 text-sm">
			<span class="text-gold">{t('week.tie')}</span>
			{t('week.playoff', { names: step.contenders.map(name).join(', ') })}
		</section>
	{:else if step?.phase === 'final'}
		<section class="card mb-5 border-gold/30 px-4 py-4 text-center">
			<p class="text-xs tracking-[0.2em] text-gold uppercase">{t('week.forTheCrown')}</p>
			<p class="font-display mt-1 text-xl font-bold text-silver">
				{name(step.finalists[0])} <span class="text-muted">{t('common.vs')}</span> {name(step.finalists[1])}
			</p>
		</section>
	{/if}

	<!-- Standings (none left in a week called off) -->
	{#if view.standings.length}
		<section class="card mb-6 overflow-hidden">
			<table class="w-full text-sm tabular-nums">
				<thead class="text-[11px] tracking-wider text-muted uppercase">
					<tr class="border-b border-line">
						<th class="py-2.5 pl-4 text-left font-medium">#</th>
						<th class="py-2.5 text-left font-medium">{t('table.player')}</th>
						<th class="py-2.5 text-center font-medium" title={t('table.playedTitle')}>{t('table.played')}</th>
						<th class="py-2.5 text-center font-medium" title={t('table.winsTitle')}>{t('table.wins')}</th>
						<th class="py-2.5 text-center font-medium" title={t('table.drawsTitle')}>{t('table.draws')}</th>
						<th class="py-2.5 text-center font-medium" title={t('table.lossesTitle')}>{t('table.losses')}</th>
						<th class="py-2.5 pr-4 text-right font-medium">{t('table.points')}</th>
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
	{/if}

	<div class="mb-8 grid gap-2 {over ? 'grid-cols-2' : ''}">
		<a href={whatsapp(shareText)} target="_blank" rel="noopener" class="btn btn-ghost">
			{t(over ? 'week.share' : 'week.shareWhatsapp')}
		</a>
		{#if over}
			{@render startButton(t('week.label', { n: view.week.number + 1 }))}
		{/if}
	</div>

	{#if todo.length}
		<section class="mb-8">
			<h2 class="mb-3 text-xs tracking-[0.2em] text-gold uppercase">{t('week.yourMove')}</h2>
			<div class="grid gap-3">
				{#each todo as game (game.id)}
					<GameCard {game} names={view.players} meId={me.id} {open} />
				{/each}
			</div>
		</section>
	{/if}

	{#if knockout.length}
		<section class="mb-8">
			<h2 class="mb-3 text-xs tracking-[0.2em] text-muted uppercase">{t('week.knockout')}</h2>
			<div class="grid gap-3">
				{#each knockout.filter((g) => !todoIds.has(g.id)) as game (game.id)}
					<GameCard {game} names={view.players} meId={me.id} {open} />
				{/each}
			</div>
		</section>
	{/if}

	{#if groupGames.length}
		<section>
			<h2 class="mb-3 text-xs tracking-[0.2em] text-muted uppercase">{t('phase.group')}</h2>
			<div class="grid gap-3">
				{#each groupGames.filter((g) => !todoIds.has(g.id)) as game (game.id)}
					<GameCard {game} names={view.players} meId={me.id} {open} />
				{/each}
			</div>
		</section>
	{/if}
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
			box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-gold) 45%, transparent);
		}
		to {
			box-shadow: 0 0 60px -20px color-mix(in srgb, var(--color-gold) 35%, transparent);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.crown-drop,
		.king-reveal {
			animation: none;
		}
	}
</style>
