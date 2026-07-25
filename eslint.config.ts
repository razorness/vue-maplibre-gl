import vueTsConfig from '@vue/eslint-config-typescript';
import type { Linter } from 'eslint';
import prettier from 'eslint-config-prettier/flat';
import oxlint from 'eslint-plugin-oxlint';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';

/*
 * Division of labour:
 *   oxlint (.oxlintrc.json)  -> correctness, main pass, runs first
 *   ESLint (this file)       -> only what oxlint cannot do: Vue SFC template rules
 *   Prettier (.prettierrc.json) -> owns all formatting
 *
 * The two trailing configs are both "turn things off" configs and must stay last:
 * `prettier` disables every ESLint rule that would fight the formatter, `oxlint` disables
 * every ESLint rule that oxlint already covers.
 */
export default [
	{
		ignores: ['**/dist/**', '**/node_modules/**', '**/coverage/**', '**/.vitepress/cache/**', '**/.vitepress/dist/**']
	},

	...pluginVue.configs['flat/recommended'],
	...vueTsConfig(),

	{
		files: ['**/*.{ts,tsx,vue}'],
		languageOptions: {
			globals: { ...globals.browser }
		},
		rules: {
			// component names are resolved from the export name, the `Mgl` prefix is intentional
			'vue/multi-word-component-names': 'off',

			/*
			 * The control components wrap a native maplibre control and deliberately render no DOM of
			 * their own — their template is a single explanatory comment, which Vue compiles to a comment
			 * vnode (exactly what the previous `.ts` implementations did with `createCommentVNode`).
			 * This rule is stricter than Vue itself and would force a pointless wrapper element.
			 */
			'vue/valid-template-root': 'off'
		}
	},

	{
		files: ['**/vite.config.ts', '**/vitest.config.ts', 'eslint.config.ts', 'scripts/**/*.ts'],
		languageOptions: {
			globals: { ...globals.node }
		}
	},

	prettier,
	...oxlint.configs['flat/all']
] satisfies Linter.Config[];
