<script lang="ts">
	import { enhance } from '$app/forms';
	import { describe, score } from '#lib/format.ts';
	import { t } from '#lib/i18n/t.svelte.ts';
	import type { GameRow } from '#lib/server/db/schema.ts';

	let {
		game,
		names,
		meId,
		open
	}: { game: GameRow; names: Map<number, { name: string }>; meId: number; open: boolean } = $props();

	const white = $derived(names.get(game.whiteId)?.name ?? '?');
	const black = $derived(names.get(game.blackId)?.name ?? '?');
	const mine = $derived(game.whiteId === meId || game.blackId === meId);
	const confirmed = $derived(!!game.confirmedAt);
	const pending = $derived(!!game.result && !confirmed);
	const iMustConfirm = $derived(pending && mine && game.reportedById !== meId);
	const opponent = $derived(game.whiteId === game.reportedById ? black : white);

	const winnerId = $derived(
		confirmed && game.result === '1-0' ? game.whiteId : confirmed && game.result === '0-1' ? game.blackId : null
	);

	let busy = $state(false);
	const submit = () => {
		busy = true;
		return async ({ update }: { update: (o?: { reset?: boolean }) => Promise<void> }) => {
			await update({ reset: false });
			busy = false;
		};
	};
</script>

<article
	data-game={game.id}
	class="card p-4 {iMustConfirm ? 'border-gold/60' : ''} {game.stage === 'final' ? 'ring-1 ring-gold/30' : ''}"
>
	<div class="mb-3 flex items-center justify-between text-[11px] tracking-wider text-muted uppercase">
		<span>
			{t(`stage.${game.stage}`)} · {t(game.stage === 'group' ? 'game.round' : 'game.game', { n: game.round })}
		</span>
		{#if game.armageddon}<span class="text-gold">Armageddon</span>{/if}
	</div>

	<div class="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
		<div class="flex items-center gap-2 truncate">
			<span class="size-3 shrink-0 rounded-full border border-silver/70 bg-silver" title={t('game.white')}></span>
			<span class="truncate font-medium {winnerId === game.whiteId ? 'text-gold' : ''} {game.whiteId === meId ? 'underline decoration-line underline-offset-4' : ''}">{white}</span>
		</div>
		<span class="font-display text-sm text-muted tabular-nums">
			{confirmed && game.result ? score(game.result) : t('common.vs')}
		</span>
		<div class="flex items-center justify-end gap-2 truncate">
			<span class="truncate font-medium {winnerId === game.blackId ? 'text-gold' : ''} {game.blackId === meId ? 'underline decoration-line underline-offset-4' : ''}">{black}</span>
			<span class="size-3 shrink-0 rounded-full border border-silver/70 bg-board" title={t('game.black')}></span>
		</div>
	</div>

	{#if open && pending && game.result}
		<p class="mt-3 text-center text-sm text-muted">
			{t('game.declared')} <span class="text-silver">{describe(t, game.result, white, black)}</span>
			{#if !iMustConfirm}· {t('game.waitingFor', { name: opponent })}{/if}
		</p>
		{#if iMustConfirm}
			<form method="POST" class="mt-3 grid grid-cols-2 gap-2" use:enhance={submit}>
				<input type="hidden" name="game" value={game.id} />
				<button formaction="?/reject" class="btn btn-ghost" disabled={busy}>{t('game.dispute')}</button>
				<button formaction="?/confirm" class="btn btn-gold" disabled={busy}>{t('game.confirm')}</button>
			</form>
		{/if}
	{:else if open && !game.result && mine}
		<form method="POST" action="?/report" class="mt-4 grid {game.armageddon ? 'grid-cols-2' : 'grid-cols-3'} gap-2" use:enhance={submit}>
			<input type="hidden" name="game" value={game.id} />
			<button name="result" value="1-0" class="btn btn-ghost truncate" disabled={busy}>{white}</button>
			{#if !game.armageddon}
				<button name="result" value="1/2-1/2" class="btn btn-ghost" disabled={busy}>{t('game.draw')}</button>
			{/if}
			<button name="result" value="0-1" class="btn btn-ghost truncate" disabled={busy}>{black}</button>
		</form>
		<p class="mt-2 text-center text-[11px] text-muted">
			{t(game.armageddon ? 'game.whoWonArmageddon' : 'game.whoWon')}
		</p>
	{/if}
</article>
