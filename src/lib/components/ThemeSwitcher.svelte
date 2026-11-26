<script lang="ts">
	import { page } from '$app/state';
	import { t } from '#lib/i18n/t.svelte.ts';
	import { THEMES, isTheme } from '#lib/theme.ts';

	let { class: klass = '' }: { class?: string } = $props();
	const current = $derived(isTheme(page.data.theme) ? page.data.theme : 'auto');
</script>

<!-- A plain form: it works without JS, and /theme sends the browser back here. -->
<form method="POST" action="/theme" class="flex items-center justify-center gap-1 text-xs tracking-wider {klass}">
	<input type="hidden" name="back" value={page.url.pathname + page.url.search} />
	{#each THEMES as theme, i (theme)}
		{#if i > 0}<span class="text-line" aria-hidden="true">·</span>{/if}
		<button
			name="theme"
			value={theme}
			aria-current={current === theme ? 'true' : undefined}
			class="rounded-md px-2 py-1 font-semibold uppercase {current === theme ? 'text-gold' : 'text-muted hover:text-silver'}"
		>
			{t(`theme.${theme}`)}
		</button>
	{/each}
</form>
