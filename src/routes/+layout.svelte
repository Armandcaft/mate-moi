<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import Crown from '#lib/components/Crown.svelte';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();

	const nav = [
		{ href: '/', label: 'La semaine' },
		{ href: '/rois', label: 'Les Rois' }
	];
</script>

<svelte:head>
	<title>Mate-Moi si tu peux</title>
</svelte:head>

<div class="mx-auto flex min-h-dvh max-w-xl flex-col">
	<header class="bg-checker border-b border-line px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-4">
		<div class="flex items-center justify-between gap-3">
			<a href="/" class="flex items-center gap-2.5">
				<Crown size={26} />
				<span class="font-display text-gold-gradient text-lg font-bold tracking-wide sm:text-xl">
					Mate-Moi si tu peux
				</span>
			</a>
			{#if data.me}
				<form method="POST" action="/logout">
					<button class="text-xs text-muted hover:text-silver" title="Se déconnecter">
						{data.me.name} · sortir
					</button>
				</form>
			{/if}
		</div>
		{#if data.me}
			<nav class="mt-4 flex gap-1 rounded-xl bg-board/60 p-1 text-sm">
				{#each nav as item (item.href)}
					<a
						href={item.href}
						class="flex-1 rounded-lg py-2 text-center font-medium transition-colors {page.url.pathname === item.href
							? 'bg-raised text-silver'
							: 'text-muted hover:text-silver'}"
						aria-current={page.url.pathname === item.href ? 'page' : undefined}
					>
						{item.label}
					</a>
				{/each}
			</nav>
		{/if}
	</header>

	<main class="flex-1 px-4 py-5 pb-[max(2rem,env(safe-area-inset-bottom))]">
		{@render children()}
	</main>
</div>
