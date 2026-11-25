<script lang="ts">
	import { t } from '#lib/i18n/t.svelte.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{data.title}</title>
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={t('app.name')} />
	<meta property="og:title" content={data.title} />
	<meta property="og:description" content={data.description} />
	<meta property="og:image" content={data.image} />
	<meta property="og:image:type" content="image/png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta http-equiv="refresh" content="0; url=/" />
</svelte:head>

<p class="pt-10 text-center text-sm text-muted"><a href="/">{t('preview.open')}</a></p>
