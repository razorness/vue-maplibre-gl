import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';
import { packageAlias } from './alias';

const resolve = (p: string) => fileURLToPath(new URL(p, import.meta.url));

/* each project is its own config, so the aliases have to be set per project, not just at the root */
const alias = [...packageAlias, { find: '@test', replacement: resolve('./test') }];

/*
 * Three projects, because the three things worth testing need three different environments:
 *
 * - `unit`    jsdom + a hand-written FakeMap (see test/fake-map.ts). This is what the 100 % coverage gate
 *             measures: prop→option mapping, the source/layer lifecycle, diffing, registries, teardown.
 * - `ssr`     node, no DOM at all. Its only job is to prove the package can be imported and rendered
 *             server-side without touching `window`/`document` — the failure mode that a jsdom test can
 *             never catch, because jsdom provides both.
 * - `browser` real Chromium with real maplibre and real WebGL. A handful of smoke tests, so an API drift
 *             in a maplibre bump fails here rather than in a consumer's app. Opt-in, since it needs a
 *             browser download.
 */
export default defineConfig({
	plugins: [vue()],
	test: {
		projects: [
			{
				plugins: [vue()],
				resolve: { alias },
				test: {
					name: 'unit',
					environment: 'jsdom',
					include: ['test/unit/**/*.spec.ts'],
					setupFiles: ['test/setup.unit.ts']
				}
			},
			{
				plugins: [vue()],
				resolve: { alias },
				test: {
					name: 'ssr',
					environment: 'node',
					include: ['test/ssr/**/*.spec.ts']
				}
			}
		],
		coverage: {
			provider: 'v8',
			/*
			 * `include` makes every matching file appear in the report, tested or not — so "100 %" means the
			 * whole source tree, not just whatever happened to be imported. (vitest 4 dropped the separate
			 * `coverage.all` flag; this is now the way to get that behaviour.)
			 */
			include: ['src/**/*.{ts,vue}'],
			exclude: [
				'src/index.ts',
				'src/plugins/draw/index.ts',
				'src/components/index.ts',
				/* type-only modules emit nothing to cover */
				'src/types/**',
				'src/**/*.spec-coverage.ts'
			],
			reporter: ['text', 'html', 'lcov'],
			thresholds: {
				lines: 100,
				functions: 100,
				branches: 100,
				statements: 100
			}
		}
	},
	resolve: { alias }
});
