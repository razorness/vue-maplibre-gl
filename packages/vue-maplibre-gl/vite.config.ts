import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import banner from 'vite-plugin-banner';
import dts from 'vite-plugin-dts';
import { packageAlias } from './alias';
import pkg from './package.json' with { type: 'json' };

const resolve = (p: string) => fileURLToPath(new URL(p, import.meta.url));

/*
 * Externals: the peers plus every declared runtime dependency, so consumers dedupe turf
 * themselves instead of getting a second copy bundled in.
 * `geojson` needs no entry — it is only ever imported via `import type` and fully erased.
 */
const external = ['vue', 'maplibre-gl', 'mitt', ...Object.keys(pkg.dependencies)];

// https://vite.dev/config/
export default defineConfig({
	resolve: { alias: packageAlias },
	plugins: [
		vue(),
		dts({
			entryRoot: 'src',
			include: ['src'],
			exclude: ['src/**/*.spec.ts', 'test'],
			bundleTypes: true,
			outDirs: 'dist',
			tsconfigPath: './tsconfig.build.json'
		}),
		banner(`/*!
* ${pkg.name} v${pkg.version}
* (c) ${new Date().getFullYear()} ${pkg.author.name}
* @license ${pkg.license}
*/`)
	],
	build: {
		target: 'es2022',
		cssCodeSplit: true,
		cssMinify: 'lightningcss',
		emptyOutDir: true,
		sourcemap: true,
		lib: {
			// entry keys become the emitted file names: dist/index.js, dist/draw.js
			entry: {
				index: resolve('./src/index.ts'),
				draw: resolve('./src/plugins/draw/index.ts')
			},
			formats: ['es']
		},
		rollupOptions: {
			external,
			output: {
				exports: 'named',
				// stable names for the chunk shared by the `.` and `./draw` entries,
				// so a release diff is not full of hash churn
				chunkFileNames: 'chunks/[name].js'
			}
		}
	}
});
