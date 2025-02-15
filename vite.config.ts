import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import banner from 'vite-plugin-banner';
import dts from 'vite-plugin-dts';
import pkg from './package.json' with { type: 'json' };


// https://vite.dev/config/
export default defineConfig(({ command }) => ({
	root   : resolve(__dirname, command === 'serve' ? 'dev' : ''),
	plugins: [
		vue(),
		dts({
			entryRoot       : 'src',
			include         : 'src',
			insertTypesEntry: true,
			staticImport    : true,
			outDir          : 'dist/types',
			tsconfigPath    : './tsconfig.app.json',
		}),
		banner(`/*!
* ${pkg.name} v${pkg.version}
* (c) ${new Date().getFullYear()} ${pkg.author.name}
* @license ${pkg.license}
*/`)
	],
	ssr    : {
		external: [ 'vue', 'maplibre-gl', 'geojson', 'mitt' ]
	},
	build  : {
		cssCodeSplit : true,
		emptyOutDir  : true,
		cssMinify    : 'lightningcss',
		sourcemap    : true,
		lib          : {
			entry: {
				'vue-maplibre-gl'     : resolve(__dirname, 'src/main.ts'),
				'vue-maplibre-gl-draw': resolve(__dirname, 'src/plugins/draw/index.ts'),
			}
		},
		rollupOptions: {
			preserveEntrySignatures: 'strict',
			// make sure to externalize deps that shouldn't be bundled
			// into your library
			external: [
				'vue',
				'maplibre-gl',
				'geojson',
				'mitt'
			],
			output  : {
				exports: 'named',
				// Provide global variables to use in the UMD build
				// for externalized deps
				globals: {
					vue          : 'Vue',
					'maplibre-gl': 'maplibregl',
					mitt         : 'mitt',
					geojson      : 'geojson'
				},
			},
		}
	},
	server : {
		host : '0.0.0.0',
		watch: {
			// to avoid full page reloads on file changes
			ignored: [ /\.idea/, /ts\.timestamp-\d+\.mjs/, /\.git/, /node_modules/ ]
		}
	},
	resolve: {
		alias: [
			{ find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
			{ find: /^~(.+)/, replacement: '$1' }
		]
	},
}));
