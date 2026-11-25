<script lang="ts">
	import { page } from '$app/state';
	import { LANGUAGE_NAMES, LOCALES } from '#lib/i18n/index.ts';
	import { locale } from '#lib/i18n/t.svelte.ts';

	let { class: klass = '' }: { class?: string } = $props();
</script>

<!-- A plain form: it works without JS, and /lang sends the browser back here. -->
<form method="POST" action="/lang" class="flex items-center justify-center gap-1 text-xs tracking-wider {klass}">
	<input type="hidden" name="back" value={page.url.pathname + page.url.search} />
	{#each LOCALES as l, i (l)}
		{#if i > 0}<span class="text-line" aria-hidden="true">·</span>{/if}
		<button
			name="lang"
			value={l}
			lang={l}
			title={LANGUAGE_NAMES[l]}
			aria-label={LANGUAGE_NAMES[l]}
			aria-current={locale() === l ? 'true' : undefined}
			class="rounded-md px-2 py-1 font-semibold uppercase {locale() === l ? 'text-gold' : 'text-muted hover:text-silver'}"
		>
			{l}
		</button>
	{/each}
</form>
