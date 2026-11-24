<script lang="ts">
	import { enhance } from '$app/forms';
	import { describe, score, STAGE_LABEL } from '#lib/format.ts';
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
			{STAGE_LABEL[game.stage]} · {game.stage === 'group' ? `Manche ${game.round}` : `Partie ${game.round}`}
		</span>
		{#if game.armageddon}<span class="text-gold">Armageddon</span>{/if}
	</div>

	<div class="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
		<div class="flex items-center gap-2 truncate">
			<span class="size-3 shrink-0 rounded-full border border-silver/70 bg-silver" title="Blancs"></span>
			<span class="truncate font-medium {winnerId === game.whiteId ? 'text-gold' : ''} {game.whiteId === meId ? 'underline decoration-line underline-offset-4' : ''}">{white}</span>
		</div>
		<span class="font-display text-sm text-muted tabular-nums">
			{confirmed && game.result ? score(game.result) : 'vs'}
		</span>
		<div class="flex items-center justify-end gap-2 truncate">
			<span class="truncate font-medium {winnerId === game.blackId ? 'text-gold' : ''} {game.blackId === meId ? 'underline decoration-line underline-offset-4' : ''}">{black}</span>
			<span class="size-3 shrink-0 rounded-full border border-silver/70 bg-board" title="Noirs"></span>
		</div>
	</div>

	{#if open && pending && game.result}
		<p class="mt-3 text-center text-sm text-muted">
			Déclaré : <span class="text-silver">{describe(game.result, white, black)}</span>
			{#if !iMustConfirm}· en attente de {opponent}{/if}
		</p>
		{#if iMustConfirm}
			<form method="POST" class="mt-3 grid grid-cols-2 gap-2" use:enhance={submit}>
				<input type="hidden" name="game" value={game.id} />
				<button formaction="?/reject" class="btn btn-ghost" disabled={busy}>Contester</button>
				<button formaction="?/confirm" class="btn btn-gold" disabled={busy}>Confirmer</button>
			</form>
		{/if}
	{:else if open && !game.result && mine}
		<form method="POST" action="?/report" class="mt-4 grid {game.armageddon ? 'grid-cols-2' : 'grid-cols-3'} gap-2" use:enhance={submit}>
			<input type="hidden" name="game" value={game.id} />
			<button name="result" value="1-0" class="btn btn-ghost truncate" disabled={busy}>{white}</button>
			{#if !game.armageddon}
				<button name="result" value="1/2-1/2" class="btn btn-ghost" disabled={busy}>Nulle</button>
			{/if}
			<button name="result" value="0-1" class="btn btn-ghost truncate" disabled={busy}>{black}</button>
		</form>
		<p class="mt-2 text-center text-[11px] text-muted">
			{game.armageddon ? 'Qui a gagné ? Une nulle compte comme une victoire des Noirs.' : 'Qui a gagné ?'}
		</p>
	{/if}
</article>
