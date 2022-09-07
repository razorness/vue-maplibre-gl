// rollup.config.js
import fs from 'fs';
import path from 'path';
import vue from 'rollup-plugin-vue';
import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import PostCSS from 'rollup-plugin-postcss';
import { terser } from 'rollup-plugin-terser';
import typescript from '@rollup/plugin-typescript';
import minimist from 'minimist';
import Scss from 'rollup-plugin-scss';
import analyze from 'rollup-plugin-analyzer';

// Get browserslist config and remove ie from es build targets
const esbrowserslist = fs.readFileSync('./.browserslistrc')
	.toString()
	.split('\n')
	.filter((entry) => entry && entry.substring(0, 2) !== 'ie');

const argv = minimist(process.argv.slice(2));

const projectRoot = path.resolve(__dirname, '..');

const baseConfig = {
	input  : 'src/entry.ts',
	plugins: {
		preVue : [
			alias({
				entries: [
					{
						find       : '@',
						replacement: `${path.resolve(projectRoot, 'src')}`
					}
				]
			})
		],
		vue    : {
			target           : 'browser',
			css              : true,
			preprocessStyles : true,
			preprocessOptions: {
				css: {
					additionalData: `@import 'src/css/maplibre.scss';`
				}
			}
		},
		postVue: [
			typescript(),
			resolve({
				extensions: [ '.js', '.jsx', '.ts', '.tsx', '.vue', '.scss' ]
			}),
			Scss({
				output      : "dist/maplibre.css",
				watch       : 'src/css',
				includePaths: [
					path.join(__dirname, '../../node_modules/'),
					'node_modules/'
				]
			}),
			// Process only `<style module>` blocks.
			PostCSS({
				extract: true,
				modules: {
					generateScopedName: '[local]___[hash:base64:5]'
				},
				include: /&module=.*\.(css)$/
			}),
			// Process all `<style>` blocks except `<style module>`.
			PostCSS({include: /(?<!&module=.*)\.css$/}),
			commonjs()
		],
		analyze: {
			summaryOnly: true
		}
	}
};

// ESM/UMD/IIFE shared settings: externals
// Refer to https://rollupjs.org/guide/en/#warning-treating-module-as-external-dependency
const external = [
	// list external dependencies, exactly the way it is written in the import statement.
	// eg. 'jquery'
	'vue',
	'maplibre-gl'
];

// UMD/IIFE shared settings: output.globals
// Refer to https://rollupjs.org/guide/en#output-globals for details
const globals = {
	// Provide global variable names to replace your external imports
	// eg. jquery: '$'
	vue: 'Vue'
};

// Customize configs for individual targets
const buildFormats = [];
if (!argv.format || argv.format === 'es') {
	const esConfig = {
		...baseConfig,
		input  : 'src/entry.esm.ts',
		external,
		output : {
			file   : 'dist/vue-maplibre-gl.esm.js',
			format : 'esm',
			exports: 'named',
			sourcemap: true,
		},
		plugins: [
			...baseConfig.plugins.preVue,
			vue(baseConfig.plugins.vue),
			...baseConfig.plugins.postVue,
			analyze(baseConfig.plugins.analyze)
		]
	};
	buildFormats.push(esConfig);
}

if (!argv.format || argv.format === 'cjs') {
	const umdConfig = {
		...baseConfig,
		external,
		output : {
			compact: true,
			file   : 'dist/vue-maplibre-gl.ssr.js',
			format : 'cjs',
			name   : 'VueMaplibreGl',
			exports: 'auto',
			sourcemap: true,
			globals
		},
		plugins: [
			...baseConfig.plugins.preVue,
			vue(baseConfig.plugins.vue),
			...baseConfig.plugins.postVue,
			analyze(baseConfig.plugins.analyze)
		]
	};
	buildFormats.push(umdConfig);
}

if (!argv.format || argv.format === 'iife') {
	const unpkgConfig = {
		...baseConfig,
		external,
		output : {
			compact: true,
			file   : 'dist/vue-maplibre-gl.min.js',
			format : 'iife',
			name   : 'VueMaplibreGl',
			exports: 'auto',
			sourcemap: true,
			globals
		},
		plugins: [
			...baseConfig.plugins.preVue,
			vue(baseConfig.plugins.vue),
			...baseConfig.plugins.postVue,
			terser({
				output: {
					ecma: 5
				}
			}),
			analyze(baseConfig.plugins.analyze)
		]
	};
	buildFormats.push(unpkgConfig);
}

// Export config
export default buildFormats;
