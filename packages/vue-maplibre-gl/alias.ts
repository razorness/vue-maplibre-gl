import { fileURLToPath } from 'node:url';

const src = (p: string) => fileURLToPath(new URL(`./src/${p}`, import.meta.url));

/**
 * Package-internal module aliases, shared by the library build, the test runner and the playground,
 * so the three cannot drift apart. The `paths` in tsconfig.src.json / tsconfig.build.json and the
 * playground's tsconfig.json mirror this list — those cannot import it.
 *
 * A bare `find` string matches the specifier exactly *and* as a `<find>/…` prefix, which is what
 * makes both `types` (the barrel) and `types/exhaustive` resolve.
 */
export const packageAlias = [
	{ find: 'components', replacement: src('components') },
	{ find: 'composable', replacement: src('composable') },
	{ find: 'css', replacement: src('css') },
	{ find: 'lib', replacement: src('lib') },
	{ find: 'plugins', replacement: src('plugins') },
	{ find: 'types', replacement: src('types') },
	{ find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) }
];
