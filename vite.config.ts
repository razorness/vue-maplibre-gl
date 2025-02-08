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
		dts({ insertTypesEntry: true }),
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
		cssMinify    : 'lightningcss',
		sourcemap    : true,
		lib          : {
			entry      : resolve(__dirname, 'src/main.ts'),
			name       : 'VueMaplibreGl',
			fileName   : (format) => `vue-maplibre-gl.${format}.js`,
			cssFileName: 'vue-maplibre-gl'
		},
		rollupOptions: {
			// make sure to externalize deps that shouldn't be bundled
			// into your library
			external: [
				'vue',
				'maplibre-gl',
				'geojson',
				'mitt'
			],
			output  : {
				// 		assetFileNames: (assetInfo) => {
				// 			if (assetInfo.name === 'main.css') {
				// 				return 'vue-maplibre-gl.css';
				// 			}
				// 			return assetInfo.name;
				// 		},
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
