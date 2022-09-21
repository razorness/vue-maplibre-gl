// vite.config.js
import { resolve } from 'path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';

export default defineConfig({
	plugins: [vue(), dts({ outputDir: 'dist/types' })],
	resolve: {
		alias: {
			'@': resolve(__dirname, './src'),
		},
	},

	build: {
		lib: {
			entry: resolve(__dirname, 'src/entry.ts'),
			name: 'VueMaplibreGl',
			fileName: (format) => {
				let desc = { cjs: 'ssr', es: 'esm', iife: 'min' }[format] || format;
				return 'vue-maplibre-gl.' + desc + '.js';
			},
			formats: ['cjs', 'es', 'iife'],
		},
		sourcemap: true,
		rollupOptions: {
			external: ['vue', 'maplibre-gl'],
			output: {
				globals: {
					vue: 'Vue',
					'maplibre-gl': 'maplibregl',
				},
			},
		},
	},
});
