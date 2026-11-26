<script lang="ts">
	import { enhance } from '$app/forms';
	import { dateTime, localInput, whatsapp } from '#lib/format.ts';
	import { timeZone } from '#lib/zone.svelte.ts';
	import { dateLocale, t } from '#lib/i18n/t.svelte.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const when = $derived(
		new Intl.DateTimeFormat(dateLocale(), { weekday: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
	);
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

	/** What the admin typed in each player's delete (or transfer) confirmation. */
	let typed = $state<Record<number, string>>({});
	let typedHeir = $state<Record<number, string>>({});
	/** Without JS the delete button stays enabled: the server checks the name either way. */
	let hydrated = $state(false);
	$effect(() => {
		hydrated = true;
	});

	/** The reset's confirmation word, compared like the server does (case, accents, spaces ignored). */
	let wipeWord = $state('');
	const loose = (v: string) => v.normalize('NFD').replace(/\p{M}/gu, '').replace(/\s+/g, '').toUpperCase();
	const wipeReady = $derived(loose(wipeWord) === loose(t('admin.wipeWord')));

	/** In the sharer's language: they know who they are inviting. */
	const inviteMessage = (link: string) => t('admin.inviteMessage', { link });
</script>

<svelte:head><title>{t('admin.title')} · {t('app.short')}</title></svelte:head>

<h1 class="font-display mb-5 text-2xl font-bold text-silver">{t('admin.title')}</h1>

{#if form?.message}
	<p class="card mb-4 border-loss/60 px-4 py-3 text-sm text-danger" role="alert">{form.message}</p>
{:else if form?.deleted}
	<p class="card mb-4 px-4 py-3 text-sm text-silver" role="status">{t('admin.deleted', { name: String(form.deleted) })}</p>
{:else if form?.deadlineSaved}
	<p class="card mb-4 border-gold/50 px-4 py-3 text-sm text-silver" role="status">
		{t('admin.deadlineSaved', { when: dateTime(new Date(form.deadlineSaved as Date), dateLocale(), timeZone()) })}
	</p>
{:else if form?.transferred}
	<p class="card mb-4 border-gold/50 px-4 py-3 text-sm text-silver" role="status">{t('admin.transferred', { name: String(form.transferred) })}</p>
{/if}

<!-- The week's deadline (group stage only) -->
{#if data.groupWeek}
	<section class="mb-8">
		<h2 class="mb-3 text-xs tracking-[0.2em] text-muted uppercase">
			{t('admin.week')} · {t('week.label', { n: data.groupWeek.number })}
		</h2>
		<form
			method="POST"
			action="?/deadline"
			class="card grid gap-2 p-4"
			use:enhance={({ formData }) => {
				// The input is in the admin's own time: send the instant, zone included.
				const local = String(formData.get('deadline') ?? '');
				if (local) formData.set('deadline', new Date(local).toISOString());
				return async ({ update }) => update({ reset: false });
			}}
		>
			{#if data.groupWeek.deadline}
				<p class="text-sm text-silver" data-deadline>
					{t('week.deadline', { when: dateTime(data.groupWeek.deadline, dateLocale(), timeZone()) })}
				</p>
			{/if}
			<label class="block">
				<span class="mb-1 block text-xs text-muted">{t('admin.deadline')}</span>
				<input
					type="datetime-local"
					name="deadline"
					required
					value={data.groupWeek.deadline ? localInput(data.groupWeek.deadline, timeZone()) : ''}
					min={localInput(new Date(), timeZone())}
					class="w-full min-w-0 rounded-xl border border-line bg-surface px-3 py-2 text-silver outline-none focus:border-gold"
				/>
			</label>
			<button class="btn btn-ghost text-xs">{t('admin.deadlineSave')}</button>
			<p class="text-xs text-muted">{t('admin.deadlineHint')}</p>
		</form>
	</section>
{/if}

<!-- Invitations -->
<section class="mb-8">
	<h2 class="mb-3 text-xs tracking-[0.2em] text-muted uppercase">{t('admin.invitePlayer')}</h2>

	{#if form?.inviteLink}
		<div class="card mb-3 border-gold/50 p-4">
			<p class="mb-2 text-sm text-silver">{t('admin.linkReady')}</p>
			<p class="mb-3 rounded-lg bg-board px-3 py-2 font-mono text-xs break-all text-muted">{form.inviteLink}</p>
			<div class="grid grid-cols-2 gap-2">
				<button type="button" class="btn btn-ghost" onclick={() => copy(form.inviteLink as string)}>
					{t(copied ? 'admin.copied' : 'admin.copy')}
				</button>
				<a class="btn btn-gold" href={whatsapp(inviteMessage(form.inviteLink as string))} target="_blank" rel="noopener">
					{t('admin.send')}
				</a>
			</div>
			<p class="mt-3 text-xs text-muted">
				{t('admin.joinRule')}
			</p>
		</div>
	{:else}
		<form method="POST" action="?/invite" use:enhance>
			<button class="btn btn-gold w-full">{t('admin.createInvite')}</button>
		</form>
	{/if}

	{#if data.invites.length}
		<div class="card mt-3 divide-y divide-line/60">
			{#each data.invites as inv (inv.id)}
				<form method="POST" action="?/revoke" use:enhance class="flex items-center justify-between gap-3 px-4 py-3 text-sm">
					<input type="hidden" name="invite" value={inv.id} />
					<span class="text-muted">{t('admin.inviteBy', { by: inv.by, when: when.format(inv.expiresAt) })}</span>
					<button class="text-xs text-danger hover:underline">{t('admin.revoke')}</button>
				</form>
			{/each}
		</div>
	{/if}
</section>

<!-- Players -->
<section class="mb-8">
	<h2 class="mb-3 text-xs tracking-[0.2em] text-muted uppercase">{t('admin.players')}</h2>

	{#if form?.tempPin}
		<div class="card mb-3 border-gold/50 p-4 text-sm" role="status">
			<p class="text-silver">{t('admin.tempPinFor', { name: nameOf(form.tempFor) })}</p>
			<p class="font-display my-2 text-center text-3xl tracking-[0.3em] text-gold">{form.tempPin}</p>
			<p class="text-xs text-muted">{t('admin.tempPinHint')}</p>
		</div>
	{/if}

	<div class="grid gap-2">
		{#each data.players as p (p.id)}
			{@const me = p.id === data.me?.id}
			<details class="card group {p.active ? '' : 'opacity-60'}">
				<summary class="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3">
					<span class="font-medium text-silver">{p.name}{me ? ` ${t('common.you')}` : ''}</span>
					<span class="flex flex-wrap justify-end gap-1 text-[10px] tracking-wider uppercase">
						{#if p.isOwner}<span class="rounded-full border border-gold bg-gold/15 px-2 py-0.5 text-gold">{t('admin.badgeOwner')}</span>
						{:else if p.isAdmin}<span class="rounded-full border border-gold/50 px-2 py-0.5 text-gold">{t('admin.badgeAdmin')}</span>{/if}
						{#if !p.active}<span class="rounded-full border border-line px-2 py-0.5 text-muted">{t('admin.badgeArchived')}</span>{/if}
						{#if p.mustChangePin}<span class="rounded-full border border-line px-2 py-0.5 text-muted">{t('admin.badgeTempPin')}</span>{/if}
						{#if locked(p)}<span class="rounded-full border border-loss/60 px-2 py-0.5 text-danger">{t('admin.badgeLocked')}</span>{/if}
					</span>
				</summary>
				<form method="POST" use:enhance class="grid grid-cols-2 gap-2 border-t border-line px-4 py-3">
					<input type="hidden" name="player" value={p.id} />
					<button formaction="?/reset" class="btn btn-ghost text-xs">{t('admin.resetPin')}</button>
					{#if !me && !p.isOwner}
						<!-- The owner keeps only the temporary code: nobody archives, demotes or deletes them. -->
						{#if p.active}
							<button formaction="?/archive" class="btn btn-ghost text-xs">{t('admin.archive')}</button>
						{:else}
							<button formaction="?/unarchive" class="btn btn-ghost text-xs">{t('admin.unarchive')}</button>
						{/if}
						{#if p.isAdmin}
							<button formaction="?/demote" class="btn btn-ghost text-xs">{t('admin.demote')}</button>
						{:else}
							<button formaction="?/promote" class="btn btn-ghost text-xs">{t('admin.promote')}</button>
						{/if}
					{/if}
				</form>
				{#if data.meIsOwner && !me && p.isAdmin && p.active}
					<details class="border-t border-line px-4 py-3">
						<summary class="cursor-pointer list-none text-center text-xs font-semibold text-gold">{t('admin.transfer')}</summary>
						<form
							method="POST"
							action="?/transfer"
							use:enhance={() =>
								async ({ update }) => {
									await update();
									typedHeir[p.id] = '';
								}}
							class="mt-3 grid gap-2"
						>
							<input type="hidden" name="player" value={p.id} />
							<p class="text-sm font-medium text-silver">{t('admin.transferTitle', { name: p.name })}</p>
							<p class="text-xs text-muted">{t('admin.transferIntro', { name: p.name })}</p>
							<label class="block">
								<span class="mb-1 block text-xs text-muted">{t('admin.deleteName')}</span>
								<input
									name="name"
									bind:value={typedHeir[p.id]}
									autocomplete="off"
									spellcheck="false"
									placeholder={p.name}
									class="w-full rounded-xl border border-line bg-surface px-3 py-2 text-silver outline-none focus:border-gold"
								/>
							</label>
							<button class="btn border border-gold/60 text-xs text-gold" disabled={hydrated && typedHeir[p.id] !== p.name}>
								{t('admin.transferConfirm')}
							</button>
						</form>
					</details>
				{/if}
				{#if !me && !p.isOwner}
					<details class="border-t border-line px-4 py-3">
						<summary class="cursor-pointer list-none text-center text-xs font-semibold text-danger">{t('admin.delete')}</summary>
						<form
							method="POST"
							action="?/delete"
							use:enhance={() =>
								async ({ update }) => {
									await update();
									typed[p.id] = '';
								}}
							class="mt-3 grid gap-2"
						>
							<input type="hidden" name="player" value={p.id} />
							<p class="text-sm font-medium text-silver">{t('admin.deleteTitle', { name: p.name })}</p>
							<p class="text-xs text-muted">{t('admin.deleteIntro')}</p>
							<label class="block">
								<span class="mb-1 block text-xs text-muted">{t('admin.deleteName')}</span>
								<input
									name="name"
									bind:value={typed[p.id]}
									autocomplete="off"
									spellcheck="false"
									placeholder={p.name}
									class="w-full rounded-xl border border-line bg-surface px-3 py-2 text-silver outline-none focus:border-danger"
								/>
							</label>
							<button class="btn border border-danger/60 text-xs text-danger" disabled={hydrated && typed[p.id] !== p.name}>
								{t('admin.deleteConfirm')}
							</button>
						</form>
					</details>
				{/if}
			</details>
		{/each}
	</div>
	<p class="mt-2 text-xs text-muted">
		{t('admin.archiveHint')}
	</p>
</section>

<!-- Backup -->
<section class={data.meIsOwner ? 'mb-8' : ''}>
	<h2 class="mb-3 text-xs tracking-[0.2em] text-muted uppercase">{t('admin.backup')}</h2>
	<a href="/admin/sauvegarde" class="btn btn-ghost w-full" data-sveltekit-reload>{t('admin.download')}</a>
	<p class="mt-2 text-xs text-muted">
		{t('admin.backupHint')}
	</p>
</section>

<!-- Reset: the owner only -->
{#if data.meIsOwner}
	<section aria-labelledby="wipe-title">
		{#if form?.wiped}
			<p class="card mb-3 border-gold/50 px-4 py-3 text-sm text-gold" role="status">
				{t('admin.wipeDone', { file: String(form.wiped) })}
			</p>
		{/if}
		<div class="card border-danger/50 p-4">
			<h2 id="wipe-title" class="text-sm font-semibold text-danger">{t('admin.wipeTitle')}</h2>
			<p class="mt-0.5 text-[11px] tracking-[0.2em] text-danger uppercase">{t('admin.wipeRisk')}</p>
			<p class="mt-3 text-sm text-muted">{t('admin.wipeIntro')}</p>
			<p class="mt-2 text-xs text-muted">{t('admin.wipeSafety')}</p>

			{#if form?.wipeMessage}
				<p class="mt-3 text-sm text-danger" role="alert">{form.wipeMessage}</p>
			{/if}
			<!-- Open/closed is left to the browser: a bound `open` would be re-applied on every keystroke. -->
			<details class="mt-4">
				<summary class="cursor-pointer text-sm text-danger hover:underline">{t('admin.wipeOpen')}</summary>
				<form method="POST" action="?/wipe" class="mt-3 space-y-3" use:enhance={() => async ({ update }) => {
					await update();
					wipeWord = '';
				}}>
					<label class="block">
						<span class="mb-1.5 block text-xs text-muted">{t('admin.wipeTypeWord', { word: t('admin.wipeWord') })}</span>
						<input
							name="word"
							bind:value={wipeWord}
							autocomplete="off"
							autocapitalize="characters"
							spellcheck="false"
							required
							class="w-full rounded-xl border border-line bg-surface px-4 py-2.5 font-medium tracking-widest text-silver outline-none focus:border-danger"
						/>
					</label>
					<label class="block">
						<span class="mb-1.5 block text-xs text-muted">{t('admin.wipeCode')}</span>
						<input
							name="pin"
							type="password"
							inputmode="numeric"
							autocomplete="current-password"
							pattern="[0-9]*"
							maxlength="8"
							required
							class="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-center text-xl tracking-[0.5em] text-silver outline-none focus:border-danger"
						/>
					</label>
					<button class="btn w-full border border-danger bg-danger/10 text-danger" disabled={hydrated && !wipeReady}>
						{t('admin.wipeButton')}
					</button>
				</form>
			</details>
		</div>
	</section>
{/if}
