// rollup.config.js
import fs from 'fs';
import path from 'path';
import vue from 'rollup-plugin-vue';
import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import babel from '@rollup/plugin-babel';
import PostCSS from 'rollup-plugin-postcss';
import { terser } from 'rollup-plugin-terser';
import ttypescript from 'ttypescript';
import typescript from 'rollup-plugin-typescript2';
import minimist from 'minimist';
import Scss from 'rollup-plugin-scss';
import analyze from 'rollup-plugin-analyzer';
import Autoprefixer from 'autoprefixer';

// Get browserslist config and remove ie from es build targets
const esbrowserslist = fs.readFileSync('./.browserslistrc')
	.toString()
	.split('\n')
	.filter((entry) => entry && entry.substring(0, 2) !== 'ie');

// Extract babel preset-env config, to combine with esbrowserslist
const babelPresetEnvConfig = require('../babel.config')
	.presets.filter((entry) => entry[ 0 ] === '@babel/preset-env')[ 0 ][ 1 ];

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
		replace: {
			'process.env.NODE_ENV': JSON.stringify('production')
		},
		vue    : {
			target           : 'browser',
			css              : false,
			preprocessStyles : true,
			preprocessOptions: {
				css: {
					additionalData: `@import 'src/css/maplibre.scss';`
				}
			}
		},
		postVue: [
			resolve({
				extensions: [ '.js', '.jsx', '.ts', '.tsx', '.vue', '.scss' ]
			}),
			Scss({
				output      : 'maplibre.css',
				include     : [ 'src/css/maplibre.scss' ],
				watch       : 'src/css',
				processor   : () => PostCSS([ Autoprefixer() ]),
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
		babel  : {
			exclude     : 'node_modules/**',
			extensions  : [ '.js', '.jsx', '.ts', '.tsx', '.vue' ],
			babelHelpers: 'bundled'
		},
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
			exports: 'named'
		},
		plugins: [
			replace(baseConfig.plugins.replace),
			...baseConfig.plugins.preVue,
			vue(baseConfig.plugins.vue),
			...baseConfig.plugins.postVue,
			// Only use typescript for declarations - babel will
			// do actual js transformations
			typescript({
				typescript               : ttypescript,
				useTsconfigDeclarationDir: true,
				emitDeclarationOnly      : true
			}),
			babel({
				...baseConfig.plugins.babel,
				presets: [
					[
						'@babel/preset-env',
						{
							...babelPresetEnvConfig,
							targets: esbrowserslist
						}
					]
				]
			}),
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
			globals
		},
		plugins: [
			replace(baseConfig.plugins.replace),
			...baseConfig.plugins.preVue,
			vue(baseConfig.plugins.vue),
			...baseConfig.plugins.postVue,
			babel(baseConfig.plugins.babel),
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
			globals
		},
		plugins: [
			replace(baseConfig.plugins.replace),
			...baseConfig.plugins.preVue,
			vue(baseConfig.plugins.vue),
			...baseConfig.plugins.postVue,
			babel(baseConfig.plugins.babel),
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
