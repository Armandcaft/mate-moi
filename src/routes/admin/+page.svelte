<script lang="ts">
	import { enhance } from '$app/forms';
	import { whatsapp } from '#lib/format.ts';
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

	/** What the admin typed in each player's delete confirmation. */
	let typed = $state<Record<number, string>>({});
	/** Without JS the delete button stays enabled: the server checks the name either way. */
	let hydrated = $state(false);
	$effect(() => {
		hydrated = true;
	});

	/** In the sharer's language: they know who they are inviting. */
	const inviteMessage = (link: string) => t('admin.inviteMessage', { link });
</script>

<svelte:head><title>{t('admin.title')} · {t('app.short')}</title></svelte:head>

<h1 class="font-display mb-5 text-2xl font-bold text-silver">{t('admin.title')}</h1>

{#if form?.message}
	<p class="card mb-4 border-loss/60 px-4 py-3 text-sm text-danger" role="alert">{form.message}</p>
{:else if form?.deleted}
	<p class="card mb-4 px-4 py-3 text-sm text-silver" role="status">{t('admin.deleted', { name: String(form.deleted) })}</p>
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
						{#if p.isAdmin}<span class="rounded-full border border-gold/50 px-2 py-0.5 text-gold">{t('admin.badgeAdmin')}</span>{/if}
						{#if !p.active}<span class="rounded-full border border-line px-2 py-0.5 text-muted">{t('admin.badgeArchived')}</span>{/if}
						{#if p.mustChangePin}<span class="rounded-full border border-line px-2 py-0.5 text-muted">{t('admin.badgeTempPin')}</span>{/if}
						{#if locked(p)}<span class="rounded-full border border-loss/60 px-2 py-0.5 text-danger">{t('admin.badgeLocked')}</span>{/if}
					</span>
				</summary>
				<form method="POST" use:enhance class="grid grid-cols-2 gap-2 border-t border-line px-4 py-3">
					<input type="hidden" name="player" value={p.id} />
					<button formaction="?/reset" class="btn btn-ghost text-xs">{t('admin.resetPin')}</button>
					{#if !me}
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
				{#if !me}
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
<section>
	<h2 class="mb-3 text-xs tracking-[0.2em] text-muted uppercase">{t('admin.backup')}</h2>
	<a href="/admin/sauvegarde" class="btn btn-ghost w-full" data-sveltekit-reload>{t('admin.download')}</a>
	<p class="mt-2 text-xs text-muted">
		{t('admin.backupHint')}
	</p>
</section>
