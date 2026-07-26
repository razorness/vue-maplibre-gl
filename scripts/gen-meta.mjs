/*
 * One metadata source for two consumers: the API tables in the docs and `web-types.json` for
 * JetBrains IDEs. Both are generated from `vue-component-meta`, which reads the components' real
 * types and JSDoc — so a prop that gains a doc comment, a default or a type shows up in the IDE and
 * on the website without anyone maintaining a table by hand.
 *
 *   pnpm meta          regenerate both artefacts
 *
 * The component list comes from the two barrels (`components/index.ts` and `plugins/draw/index.ts`),
 * not from a glob: those barrels define the public API and the public *names*, and the plugin
 * `install()` registers exactly those. A component that is not exported is not documented.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createChecker } from 'vue-component-meta';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PKG = resolve(ROOT, 'packages/vue-maplibre-gl');
const SRC = resolve(PKG, 'src');

const BARRELS = [
	{ file: resolve(SRC, 'components/index.ts'), entry: 'vue-maplibre-gl' },
	{ file: resolve(SRC, 'plugins/draw/index.ts'), entry: 'vue-maplibre-gl/draw' }
];

const pkgJson = JSON.parse(readFileSync(resolve(PKG, 'package.json'), 'utf8'));

/**
 * Package-internal specifier -> file path. The aliases mirror the folder layout of `src`
 * one-to-one (see CLAUDE.md), so no alias table is needed here: `lib/debounce` *is* `src/lib/debounce`.
 */
function resolveSpecifier(specifier) {
	const rel = specifier.startsWith('@/') ? specifier.slice(2) : specifier;
	return resolve(SRC, rel);
}

/** `export { default as MglMap } from 'components/MglMap.vue'` -> [name, file] */
function componentsOf(barrel) {
	const source = readFileSync(barrel.file, 'utf8');
	const out = [];
	for (const match of source.matchAll(/export\s*\{\s*default as (\w+)\s*}\s*from\s*'([^']+\.vue)'/g)) {
		out.push({ name: match[1], file: resolveSpecifier(match[2]), entry: barrel.entry });
	}
	return out;
}

const components = BARRELS.flatMap(componentsOf);
if (components.length === 0) {
	console.error('gen-meta: no components found — did the barrels change shape?');
	process.exit(1);
}

const checker = createChecker(resolve(PKG, 'tsconfig.src.json'), { forceUseTs: true });

/** Types come out of the checker with newlines and doubled spaces; tables need one line. */
const oneLine = value => (value ?? '').replaceAll(/\s+/g, ' ').trim();

const isDeprecated = item => (item.tags ?? []).some(tag => tag.name === 'deprecated');

const docOf = item => {
	const deprecation = (item.tags ?? []).find(tag => tag.name === 'deprecated');
	const parts = [item.description];
	if (deprecation) parts.push(`**Deprecated.** ${deprecation.text ?? ''}`);
	return oneLine(parts.filter(Boolean).join(' '));
};

function metaOf({ name, file, entry }) {
	const meta = checker.getComponentMeta(file, 'default');
	return {
		name,
		entry,
		source: file.slice(PKG.length + 1),
		props: meta.props
			.filter(prop => !prop.global)
			.map(prop => ({
				name: prop.name,
				type: oneLine(prop.type),
				required: prop.required,
				default: oneLine(prop.default) || undefined,
				deprecated: isDeprecated(prop) || undefined,
				description: docOf(prop) || undefined
			}))
			.toSorted((a, b) => Number(b.required) - Number(a.required) || a.name.localeCompare(b.name)),
		events: meta.events.map(event => ({
			name: event.name,
			type: oneLine(event.type),
			description: docOf(event) || undefined
		})),
		slots: meta.slots.map(slot => ({
			name: slot.name,
			type: oneLine(slot.type),
			description: docOf(slot) || undefined
		})),
		exposed: meta.exposed
			.filter(item => !item.name.startsWith('$'))
			.map(item => ({ name: item.name, type: oneLine(item.type), description: docOf(item) || undefined }))
	};
}

const start = Date.now();
const metas = components.map(component => {
	process.stdout.write(`  ${component.name}\r`);
	return metaOf(component);
});

/*
 * The named layer wrappers declare no `emits` on purpose: declaring them would *consume* the
 * listeners instead of passing them on, and maplibre needs the `(event, layerId, handler)` signature
 * that Vue's emit system cannot express. They forward `$attrs` onto `MglLayer`'s vnode instead, so
 * `<MglFillLayer @click="…">` works while the checker sees nothing. Without this the docs and the IDE
 * would claim the wrappers have no events at all.
 */
const forwardedLayerEvents = [];
for (const event of metas.find(meta => meta.name === 'MglLayer')?.events ?? []) {
	forwardedLayerEvents.push({ ...event, forwarded: true });
}
for (const meta of metas) {
	if (meta.source.startsWith('src/components/layers/') && meta.events.length === 0) {
		meta.events = forwardedLayerEvents;
	}
}

/* ---- 1. docs: consumed by the ApiTable component ------------------------------------------- */
const docsMeta = resolve(ROOT, 'docs/.vitepress/generated');
mkdirSync(docsMeta, { recursive: true });
writeFileSync(resolve(docsMeta, 'components.json'), JSON.stringify(metas, null, '\t') + '\n');

/* ---- 2. web-types.json: consumed by JetBrains IDEs ----------------------------------------- */
const webTypes = {
	$schema: 'https://json.schemastore.org/web-types',
	framework: 'vue',
	name: pkgJson.name,
	version: pkgJson.version,
	'js-types-syntax': 'typescript',
	'description-markup': 'markdown',
	'framework-config': {
		'enable-when': {
			'node-packages': [pkgJson.name]
		}
	},
	contributions: {
		html: {
			'vue-components': metas.map(meta => ({
				name: meta.name,
				source: { module: meta.entry, symbol: meta.name },
				description: `\`${meta.name}\` — see the API reference.`,
				'doc-url': `https://razorness.github.io/vue-maplibre-gl/api/${meta.name}`,
				props: meta.props.map(prop => ({
					name: prop.name,
					description: prop.description,
					required: prop.required,
					default: prop.default,
					deprecated: prop.deprecated,
					value: { kind: 'expression', type: prop.type }
				})),
				js: {
					events: meta.events.map(event => ({ name: event.name, description: event.description })),
					properties: meta.exposed.map(item => ({ name: item.name, description: item.description, type: item.type }))
				},
				slots: meta.slots.map(slot => ({ name: slot.name, description: slot.description }))
			}))
		}
	}
};
writeFileSync(resolve(PKG, 'web-types.json'), JSON.stringify(webTypes, null, '\t') + '\n');

/* both artefacts are formatted, so `prettier --check` stays green */
execFileSync('npx', ['prettier', '--write', '--log-level', 'warn', resolve(docsMeta, 'components.json'), resolve(PKG, 'web-types.json')], {
	cwd: ROOT,
	stdio: 'inherit'
});

const counts = metas.reduce(
	(acc, m) => ({ props: acc.props + m.props.length, events: acc.events + m.events.length, slots: acc.slots + m.slots.length }),
	{ props: 0, events: 0, slots: 0 }
);
const undocumented = metas.flatMap(m => m.props.filter(p => !p.description).map(p => `${m.name}.${p.name}`));

console.log(
	`gen-meta: ${metas.length} components, ${counts.props} props, ${counts.events} events, ${counts.slots} slots ` +
		`in ${((Date.now() - start) / 1000).toFixed(1)}s`
);
console.log(`  docs      docs/.vitepress/generated/components.json`);
console.log(`  IDE       packages/vue-maplibre-gl/web-types.json`);
if (undocumented.length > 0) {
	console.log(`  ${undocumented.length} props without a doc comment, e.g. ${undocumented.slice(0, 5).join(', ')}`);
}
