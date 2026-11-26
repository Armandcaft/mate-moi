// The standings card WhatsApp shows as a link preview (1200×630 PNG).
// Satori lays out a small element tree and turns text into paths; resvg rasterises the SVG.
import { Resvg } from '@resvg/resvg-js';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import satori from 'satori';
import { translator, type Locale, type Translate } from '../i18n/index.ts';
import { playerName } from '../format.ts';
import type { WeekView } from './league.ts';

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;
const PAD_X = 64;
/** Satori resolves '100%' against the padded box, so the content width is given in pixels. */
const INNER = OG_WIDTH - 2 * PAD_X;

const C = {
	board: '#0B0B0D',
	surface: '#151518',
	line: '#26262B',
	silver: '#C8CBD2',
	muted: '#7C8088',
	gold: '#C9A24A',
	goldHi: '#E8C976'
};

const require = createRequire(import.meta.url);
const font = (pkg: string, file: string) =>
	readFileSync(join(dirname(require.resolve(`${pkg}/package.json`)), 'files', file));

let fonts: Parameters<typeof satori>[1]['fonts'] | undefined;
const loadFonts = () =>
	(fonts ??= [
		{ name: 'Inter', data: font('@fontsource/inter', 'inter-latin-500-normal.woff'), weight: 500 },
		{ name: 'Inter', data: font('@fontsource/inter', 'inter-latin-600-normal.woff'), weight: 600 },
		{ name: 'Cinzel', data: font('@fontsource/cinzel', 'cinzel-latin-700-normal.woff'), weight: 700 }
	]);

const CROWN = `data:image/svg+xml;utf8,${encodeURIComponent(
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E8C976"/><stop offset="1" stop-color="#A9822F"/></linearGradient></defs><path fill="url(#g)" d="M8 20l11 10 13-18 13 18 11-10-5 26H13z"/><rect x="13" y="49" width="38" height="6" rx="2" fill="url(#g)"/></svg>`
)}`;

const pts = (t: Translate, n: number) => t('common.pts', { n });

type Node = { type: string; props: Record<string, unknown> };
type Child = Node | string | null | undefined | false;

/** A tiny hyperscript: satori takes React-shaped objects, no JSX needed. */
function h(type: string, style: Record<string, unknown>, ...children: Child[]): Node {
	const kids = children.filter((c): c is Node | string => !!c);
	return {
		type,
		props: { style: { display: 'flex', ...style }, children: kids.length === 1 ? kids[0] : kids }
	};
}

const crown = (size: number): Node => ({
	type: 'img',
	props: { src: CROWN, width: size, height: size, style: { width: size, height: size } }
});

function card(view: WeekView | null, locale: Locale): Node {
	const t = translator(locale);
	const caps = (s: string) => s.toLocaleUpperCase(locale);
	const name = (id: number) => playerName(t, view?.players.get(id));
	const step = view?.step;

	const header = h(
		'div',
		{ alignItems: 'center', gap: 18 },
		crown(52),
		h('div', { fontFamily: 'Cinzel', fontSize: 38, color: C.gold, letterSpacing: 1 }, t('app.name'))
	);

	if (!view || !step) {
		return frame(
			header,
			h('div', { flex: 1, alignItems: 'center', justifyContent: 'center', fontFamily: 'Cinzel', fontSize: 64, color: C.silver }, t('week.emptyThrone'))
		);
	}

	const group = view.games.filter((g) => g.stage === 'group');
	const played = group.filter((g) => g.confirmedAt).length;
	const subtitle =
		`${t('week.label', { n: view.week.number })} · ${t(`phase.${step.phase}`)}` +
		(step.phase === 'group' ? ` · ${t('preview.progress', { played, n: group.length })}` : '');
	const king = step.phase === 'done' ? step.king : null;

	const rows = view.standings.slice(0, 4).map((l) => {
		const gold = king !== null ? king === l.playerId : l.rank === 1 && l.points > 0;
		return h(
			'div',
			{
				alignItems: 'center',
				padding: '16px 32px',
				borderTop: `1px solid ${C.line}`,
				fontSize: 34,
				color: gold ? C.goldHi : C.silver
			},
			h('div', { width: 56, color: C.muted, fontSize: 28 }, String(l.rank)),
			h('div', { flex: 1, fontWeight: 600, alignItems: 'center', gap: 12 }, name(l.playerId), king === l.playerId && crown(30)),
			h('div', { width: 200, color: C.muted, fontSize: 26 }, t('preview.record', { w: l.wins, d: l.draws, l: l.losses })),
			h('div', { width: 140, justifyContent: 'flex-end', fontWeight: 600, fontSize: 40 }, pts(t, l.points))
		);
	});

	const table = h(
		'div',
		{
			width: INNER,
			flexDirection: 'column',
			background: C.surface,
			border: `1px solid ${C.line}`,
			borderRadius: 24,
			overflow: 'hidden',
			marginTop: -1
		},
		...rows
	);

	const hero =
		king !== null
			? h(
					'div',
					{ flexDirection: 'column', alignItems: 'center', margin: '18px 0 22px' },
					h('div', { fontSize: 24, color: C.gold, letterSpacing: 8 }, caps(t('week.king', { n: view.week.number }))),
					h('div', { fontFamily: 'Cinzel', fontSize: 88, color: C.goldHi, lineHeight: 1.1 }, name(king)),
					view.players.get(king)?.slogan &&
						h('div', { fontSize: 26, color: C.silver, marginTop: 6, fontStyle: 'italic' }, t('common.quote', { text: view.players.get(king)?.slogan ?? '' }))
				)
			: step.phase === 'final'
				? h(
						'div',
						{ flexDirection: 'column', alignItems: 'center', margin: '18px 0 22px' },
						h('div', { fontSize: 24, color: C.gold, letterSpacing: 8 }, caps(t('week.forTheCrown'))),
						h(
							'div',
							{ fontFamily: 'Cinzel', fontSize: 60, color: C.silver, gap: 24, alignItems: 'center' },
							name(step.finalists[0]),
							h('div', { color: C.muted, fontSize: 40 }, t('common.vs')),
							name(step.finalists[1])
						)
					)
				: h('div', { fontSize: 28, color: C.muted, margin: '14px 0 26px', justifyContent: 'center' }, subtitle);

	return frame(header, h('div', { flex: 1, width: INNER, flexDirection: 'column', justifyContent: 'center' }, hero, table));
}

function frame(...children: Node[]): Node {
	return h(
		'div',
		{
			width: OG_WIDTH,
			height: OG_HEIGHT,
			flexDirection: 'column',
			padding: `44px ${PAD_X}px`,
			backgroundColor: C.board,
			backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(201,162,74,0.25), rgba(11,11,13,0) 60%)',
			fontFamily: 'Inter',
			color: C.silver
		},
		...children
	);
}

export async function standingsPng(view: WeekView | null, locale: Locale): Promise<Buffer> {
	const svg = await satori(card(view, locale) as Parameters<typeof satori>[0], {
		width: OG_WIDTH,
		height: OG_HEIGHT,
		fonts: loadFonts()
	});
	return new Resvg(svg, { fitTo: { mode: 'width', value: OG_WIDTH } }).render().asPng();
}

/** One line for the preview's description: "Sam 11 pts · Alex 10 pts · Max 4 pts". */
export function standingsLine(view: WeekView | null, locale: Locale): string {
	const t = translator(locale);
	if (!view) return t('preview.tagline');
	return view.standings
		.map((l) => `${playerName(t, view.players.get(l.playerId))} ${pts(t, l.points)}`)
		.join(' · ');
}

/** Changes whenever the standings do, so WhatsApp (which caches previews per link) refetches. */
export function shareKey(view: WeekView | null): string {
	if (!view) return '0';
	return `${view.week.number}-${view.games.filter((g) => g.confirmedAt).length}`;
}
