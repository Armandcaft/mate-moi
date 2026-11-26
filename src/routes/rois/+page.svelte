<script lang="ts">
	import Crown from '#lib/components/Crown.svelte';
	import { playerName } from '#lib/format.ts';
	import { dateLocale, t } from '#lib/i18n/t.svelte.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const names = $derived(new Map(data.players.map((p) => [p.id, playerName(t, p)])));
	const slogans = $derived(new Map(data.players.map((p) => [p.id, p.slogan])));
	const name = (id: number) => names.get(id) ?? '?';
	const podium = $derived(
		[...data.crowns.entries()].sort((a, b) => b[1] - a[1]).map(([id, n]) => ({ id, n }))
	);
	const active = $derived(data.players.filter((p) => p.active));
	const fmt = $derived(new Intl.DateTimeFormat(dateLocale(), { day: 'numeric', month: 'short' }));
</script>

<svelte:head><title>{t('kings.title')} · {t('app.short')}</title></svelte:head>

<h1 class="font-display mb-5 text-2xl font-bold text-silver">{t('kings.title')}</h1>

{#if data.reigns.length === 0}
	<p class="card px-5 py-8 text-center text-sm text-muted">{t('kings.none')}</p>
{:else}
	<!-- Crowns -->
	<section class="mb-6 grid grid-cols-3 gap-2">
		{#each podium as p, i (p.id)}
			<div class="card px-3 py-4 text-center {i === 0 ? 'border-gold/50' : ''}">
				<Crown size={i === 0 ? 30 : 22} class="mx-auto mb-2 {i === 0 ? '' : 'opacity-60 grayscale'}" />
				<p class="truncate font-medium {i === 0 ? 'text-gold' : 'text-silver'}">{name(p.id)}</p>
				{#if slogans.get(p.id)}
					<p class="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted italic">{t('common.quote', { text: slogans.get(p.id) ?? '' })}</p>
				{/if}
				<p class="text-xs text-muted">{t('kings.crowns', { n: p.n })}</p>
			</div>
		{/each}
	</section>

	<!-- Reigns -->
	<section class="card mb-6 divide-y divide-line/60">
		{#each data.reigns as r (r.number)}
			<div class="flex items-center justify-between px-4 py-3 text-sm">
				<span class="text-muted">{t('week.label', { n: r.number })}{r.closedAt ? ` · ${fmt.format(r.closedAt)}` : ''}</span>
				<span class="inline-flex items-center gap-1.5 font-medium text-silver">
					<Crown size={14} />{name(r.kingId)}
				</span>
			</div>
		{/each}
	</section>
{/if}

<h2 class="mb-3 text-xs tracking-[0.2em] text-muted uppercase">{t('kings.allTime')}</h2>
<section class="card mb-6 overflow-hidden">
	<table class="w-full text-sm tabular-nums">
		<thead class="text-[11px] tracking-wider text-muted uppercase">
			<tr class="border-b border-line">
				<th class="py-2.5 pl-4 text-left font-medium">{t('table.player')}</th>
				<th class="py-2.5 text-center font-medium" title={t('table.playedTitle')}>{t('table.played')}</th>
				<th class="py-2.5 text-center font-medium" title={t('table.winsTitle')}>{t('table.wins')}</th>
				<th class="py-2.5 text-center font-medium" title={t('table.drawsTitle')}>{t('table.draws')}</th>
				<th class="py-2.5 text-center font-medium" title={t('table.lossesTitle')}>{t('table.losses')}</th>
				<th class="py-2.5 pr-4 text-right font-medium">{t('table.points')}</th>
			</tr>
		</thead>
		<tbody>
			{#each data.allTime.filter((l) => l.played > 0) as l (l.playerId)}
				<tr class="border-b border-line/60 last:border-0">
					<td class="py-3 pl-4 font-medium text-silver">{name(l.playerId)}</td>
					<td class="py-3 text-center text-muted">{l.played}</td>
					<td class="py-3 text-center">{l.wins}</td>
					<td class="py-3 text-center">{l.draws}</td>
					<td class="py-3 text-center">{l.losses}</td>
					<td class="py-3 pr-4 text-right font-semibold text-silver">{l.points}</td>
				</tr>
			{:else}
				<tr><td colspan="6" class="px-4 py-6 text-center text-muted">{t('kings.noGames')}</td></tr>
			{/each}
		</tbody>
	</table>
</section>

{#if active.length > 1}
	<h2 class="mb-3 text-xs tracking-[0.2em] text-muted uppercase">{t('kings.headToHead')}</h2>
	<section class="card overflow-x-auto">
		<table class="w-full text-sm tabular-nums">
			<thead>
				<tr class="border-b border-line text-[11px] text-muted">
					<th></th>
					{#each active as col (col.id)}
						<th class="px-2 py-2.5 font-medium">{playerName(t, col)}</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each active as row (row.id)}
					<tr class="border-b border-line/60 last:border-0">
						<th class="py-3 pr-2 pl-4 text-left font-medium text-silver">{playerName(t, row)}</th>
						{#each active as col (col.id)}
							{@const rec = data.h2h.get(row.id)?.get(col.id)}
							<td class="px-2 py-3 text-center {row.id === col.id ? 'bg-board/50' : ''}">
								{#if row.id === col.id}
									<span class="text-line">—</span>
								{:else if rec}
									<span class={rec.w > rec.l ? 'text-gold' : rec.w < rec.l ? 'text-muted' : 'text-silver'}>
										{rec.w}-{rec.d}-{rec.l}
									</span>
								{:else}
									<span class="text-muted">·</span>
								{/if}
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</section>
{/if}
