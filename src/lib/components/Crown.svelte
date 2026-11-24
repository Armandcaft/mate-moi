<script lang="ts">
	let { size = 20, class: klass = '' }: { size?: number; class?: string } = $props();
	const id = $props.id();
</script>

<svg width={size} height={size} viewBox="0 0 64 64" class={klass} aria-hidden="true">
	<defs>
		<linearGradient {id} x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#E8C976" />
			<stop offset="1" stop-color="#A9822F" />
		</linearGradient>
	</defs>
	<path fill="url(#{id})" d="M8 20l11 10 13-18 13 18 11-10-5 26H13z" />
	<rect x="13" y="49" width="38" height="6" rx="2" fill="url(#{id})" />
</svg>
