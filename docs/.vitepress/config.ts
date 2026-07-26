import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitepress';
import { packageAlias } from '../../packages/vue-maplibre-gl/alias';

const pkg = (p: string) => fileURLToPath(new URL(`../../packages/vue-maplibre-gl/${p}`, import.meta.url));

/*
 * The docs are the playground: every demo imports `vue-maplibre-gl` from source through the aliases
 * below, so a library edit hot-reloads here. That is also why the package's own internal aliases have
 * to resolve — the source files use them (see CLAUDE.md, Imports).
 */
export default defineConfig({
	title: 'vue-maplibre-gl',
	description: 'Vue 3 components and composables for maplibre-gl v6 — typed, tree-shakeable, SSR-safe.',
	lang: 'en-US',
	base: '/vue-maplibre-gl/',
	cleanUrls: true,
	lastUpdated: true,

	head: [['link', { rel: 'icon', href: '/vue-maplibre-gl/img/draw_polygon.png' }]],

	vite: {
		resolve: {
			alias: [
				{ find: /^vue-maplibre-gl\/style\.css$/, replacement: pkg('src/css/index.css') },
				{ find: /^vue-maplibre-gl\/draw\.css$/, replacement: pkg('src/plugins/draw/draw.plugin.css') },
				{ find: /^vue-maplibre-gl\/draw$/, replacement: pkg('src/plugins/draw/index.ts') },
				{ find: /^vue-maplibre-gl$/, replacement: pkg('src/index.ts') },
				...packageAlias
			]
		}
	},

	themeConfig: {
		nav: [
			{ text: 'Guide', link: '/guide/getting-started' },
			{ text: 'API', link: '/api/' },
			{ text: 'Draw', link: '/draw/' },
			{ text: 'Migration', link: '/migration' },
			{
				text: 'v6',
				items: [
					{ text: 'Changelog', link: 'https://github.com/razorness/vue-maplibre-gl/releases' },
					{ text: 'npm', link: 'https://www.npmjs.com/package/vue-maplibre-gl' }
				]
			}
		],

		sidebar: [
			{
				text: 'Guide',
				items: [
					{ text: 'Installation', link: '/guide/installation' },
					{ text: 'Getting started', link: '/guide/getting-started' },
					{ text: 'Sources & layers', link: '/guide/sources-and-layers' },
					{ text: 'Composables', link: '/guide/composables' },
					{ text: 'Style switching', link: '/guide/style-switching' },
					{ text: 'Camera binding', link: '/guide/camera' },
					{ text: 'Terrain, sky & globe', link: '/guide/style-settings' },
					{ text: 'Marker & popup', link: '/guide/marker-and-popup' },
					{ text: 'Theming with CSS', link: '/guide/theming' },
					{ text: 'SSR & Nuxt', link: '/guide/ssr' }
				]
			},
			{
				text: 'API reference',
				items: [
					{ text: 'Overview', link: '/api/' },
					{ text: 'Map', link: '/api/map' },
					{ text: 'Sources', link: '/api/sources' },
					{ text: 'Layers', link: '/api/layers' },
					{ text: 'Controls', link: '/api/controls' },
					{ text: 'Style settings', link: '/api/style' },
					{ text: 'Marker & popup', link: '/api/marker-popup' },
					{ text: 'Composables', link: '/api/composables' }
				]
			},
			{
				text: 'Draw plugin',
				items: [{ text: 'Overview', link: '/draw/' }]
			}
		],

		socialLinks: [{ icon: 'github', link: 'https://github.com/razorness/vue-maplibre-gl' }],

		search: { provider: 'local' },

		editLink: {
			pattern: 'https://github.com/razorness/vue-maplibre-gl/edit/master/docs/:path'
		},

		footer: {
			message: 'Released under the MIT License.',
			copyright: `© ${new Date().getFullYear()} Volker Nauruhn`
		}
	}
});
