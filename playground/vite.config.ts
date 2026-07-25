import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import { packageAlias } from '../packages/vue-maplibre-gl/alias';

const pkg = (p: string) => fileURLToPath(new URL(`../packages/vue-maplibre-gl/${p}`, import.meta.url));

// https://vite.dev/config/
export default defineConfig({
	plugins: [vue()],
	resolve: {
		// consume the workspace package straight from source, so HMR covers the library too.
		// keep these in sync with the `paths` in ./tsconfig.json.
		alias: [
			{ find: /^vue-maplibre-gl\/style\.css$/, replacement: pkg('src/css/index.css') },
			{ find: /^vue-maplibre-gl\/draw\.css$/, replacement: pkg('src/plugins/draw/draw.plugin.css') },
			{ find: /^vue-maplibre-gl\/draw$/, replacement: pkg('src/plugins/draw/index.ts') },
			{ find: /^vue-maplibre-gl$/, replacement: pkg('src/index.ts') },
			// the library is consumed from source, so its own internal aliases have to resolve here too
			...packageAlias
		]
	},
	server: {
		host: '0.0.0.0',
		watch: {
			// to avoid full page reloads on file changes
			ignored: [/\.idea/, /ts\.timestamp-\d+\.mjs/, /\.git/, /node_modules/]
		}
	}
});
