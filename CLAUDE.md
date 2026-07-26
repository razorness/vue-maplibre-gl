# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

pnpm workspace (pnpm 11, `packageManager` pinned). Run everything from the repo root:

```shell
pnpm install        # install all workspaces
pnpm dev            # playground dev server (host 0.0.0.0), library served from source
pnpm build          # build the package: vue-tsc -b + vite build (ESM + d.ts + banner)
pnpm typecheck      # vue-tsc across all workspaces
pnpm lint           # oxlint --type-aware, eslint, prettier --check, then the padded-blocks check
pnpm lint:fix       # all three with --fix / --write
pnpm format         # prettier --write .
pnpm format:check   # prettier --check .  (part of `pnpm lint`)
pnpm test           # vitest
pnpm meta           # regenerate the API metadata + web-types.json (see Docs)
pnpm docs:dev       # VitePress site (which is also the second playground)
pnpm docs:build     # build the docs
pnpm changeset      # record a change for the next release
pnpm upgrade        # npx taze major -I -r (interactive dep upgrade)
```

Three tools with strictly separated jobs — do not let their responsibilities overlap:

| Tool         | Config             | Owns                                                         |
| ------------ | ------------------ | ------------------------------------------------------------ |
| **oxlint**   | `.oxlintrc.json`   | correctness; the main pass, type-aware via `oxlint-tsgolint` |
| **ESLint**   | `eslint.config.ts` | only what oxlint cannot do: Vue SFC template rules           |
| **Prettier** | `.prettierrc.json` | **all** formatting                                           |

`eslint.config.ts` ends with two "turn things off" configs that must stay last: `eslint-config-prettier`
(kills every ESLint rule that would fight the formatter) and `eslint-plugin-oxlint` (kills every ESLint
rule oxlint already covers). Never add a formatting rule to ESLint or oxlint — Prettier decides.

**Formatting is not a matter of taste here — run `pnpm format`.** Prettier settings: tabs (width 4),
`printWidth` 140, single quotes, semicolons, no trailing commas, `arrowParens: avoid`. `.editorconfig`
mirrors this for editors. `playground/drawData.ts` (large GeoJSON fixture) is in `.prettierignore`.

Two Prettier plugins are loaded, and both are load-bearing:

| Plugin                                        | Job                                                     |
| --------------------------------------------- | ------------------------------------------------------- |
| `@ianvs/prettier-plugin-sort-imports`         | import order (see _Imports_)                            |
| `./scripts/prettier-plugin-padded-blocks.mjs` | blank lines Prettier itself refuses to keep (see below) |

**`scripts/prettier-plugin-padded-blocks.mjs`** puts a blank line after a class body's `{` and before
its `}`, and the same around a function body longer than 4 formatted lines. Prettier cannot express
this and actively strips such lines, and `eslint-config-prettier` disables `padded-blocks` precisely
because an ESLint rule would fight `prettier --check` forever. The plugin therefore wraps the built-in
estree printer and injects a `hardline` into the returned Doc — the only interception point Prettier
offers, since there is no post-processing hook.

Three consequences to keep in mind:

- Scope is `paddedBlocksScope: 'methods'` (class methods, getters, setters). Plain functions —
  i.e. nearly all of `composable/` and `lib/` — are untouched. Set the option to `'all'` in
  `.prettierrc.json` to include every function and arrow function; `paddedBlocksMinLines` moves the
  4-line threshold.
- The threshold counts **formatted** lines, not source lines. Counting source lines is not
  idempotent: Prettier may reflow `if (x) { y(); }` onto three lines, which pushes a body over the
  threshold only on the _second_ run, and `prettier --check` then contradicts `--write`.
- Because it reaches into an unofficial seam, `pnpm lint` runs `scripts/check-padded-blocks.mjs`
  (`pnpm lint:padding`), which asserts over every file that stripping the added blank lines
  reproduces plain Prettier output byte for byte, and that formatting twice is a no-op. **On a
  Prettier upgrade, that script is what tells you whether the plugin still works.** The plugin
  itself degrades to "no padding" rather than to broken output if the Doc shape changes.

> Historical note: this repo used to align `=` and `:` vertically and put spaces inside brackets
> (`[ 1, 2 ]`, `arr[ i ]`). Prettier cannot express that, so it is gone. Do not reintroduce it.

`.oxlintrc.json` findings currently marked `warn` are known debt with a comment naming the phase that
clears them; do not silence them further.

## What this repo is

A published Vue 3 library wrapping maplibre-gl — not an application. Layout:

| Path                        | Role                                                                                            |
| --------------------------- | ----------------------------------------------------------------------------------------------- |
| `packages/vue-maplibre-gl/` | the published package (the only publishable workspace)                                          |
| `playground/`               | dev sandbox; consumes the library **from source** via vite aliases, so library edits hot-reload |
| `docs/`                     | VitePress 2 site; also consumes the library from source, so the demos are the second playground |

**ESM only.** maplibre-gl v6 publishes no CommonJS entry (`exports` has no `require` condition and
there is no `main`), so `require('maplibre-gl')` is impossible and a CJS build of this package would
be dead weight. `dist/` contains no `.cjs`.

Two build entries with an `exports` map; the draw plugin is reachable **only** via `./draw`:

| Subpath       | Entry                              | Output                              |
| ------------- | ---------------------------------- | ----------------------------------- |
| `.`           | `src/index.ts`                     | `dist/index.js` + `dist/index.d.ts` |
| `./draw`      | `src/plugins/draw/index.ts`        | `dist/draw.js` + `dist/draw.d.ts`   |
| `./style.css` | `src/css/index.css`                | `dist/index.css`                    |
| `./draw.css`  | `src/plugins/draw/draw.plugin.css` | `dist/draw.css`                     |

`src/index.ts` deliberately does **not** re-export the draw plugin (it did in v5): otherwise the draw
code and the `@turf/*` dependencies land in the main entry and `./draw` is pointless. The chunk both
entries share (`MglButton`/`CustomControl`) is emitted with a stable name to `dist/chunks/`.

`vue`, `maplibre-gl` and `mitt` are peers/externals; every declared runtime dependency is also
externalized so consumers dedupe turf. `geojson` is **not** a dependency of any kind — only
`@types/geojson` is, and it is a real `dependency` because the public d.ts references it.

The only runtime `dependencies` besides that are `@turf/*`, used **exclusively** by the draw plugin —
never import turf outside `src/plugins/draw/`.

### Imports

- Inside `packages/vue-maplibre-gl` there are **no relative import paths**. Every one of `src`'s six
  root folders is its own bare alias, `src` itself is `@/`, and `test/` is `@test/`:

  ```ts
  import MglButton from 'components/MglButton.vue';
  import { LayerLib } from 'lib/layer.lib'; // not '../../lib/layer.lib'
  import type { AssertNever } from 'types/exhaustive';
  import { MglDefaults } from '@/defaults'; // root-level files
  ```

  `types` and `components` also resolve bare (their `index.ts` barrels). No explicit `.ts`
  extensions anywhere.

  **Five places declare this and none derives from another** — change one, change all:
  `packages/vue-maplibre-gl/alias.ts` (the runtime source of truth, imported by the package's
  `vite.config.ts`, its `vitest.config.ts` **per project**, and `playground/vite.config.ts`), plus
  the `paths` in `tsconfig.src.json`, `tsconfig.build.json` and `playground/tsconfig.json`.
  `paths` cannot move into `tsconfig.base.json`: they resolve relative to the file that _declares_
  them, which would be the repo root.

  This reverses the earlier "relative imports only" rule, whose reason was d.ts portability. It no
  longer applies because `vite-plugin-dts` runs with `bundleTypes`, so `dist/index.d.ts` and
  `dist/draw.d.ts` inline every internal module and import nothing but `vue`, `maplibre-gl`, `mitt`
  and `geojson` — verified on the built artefact, not assumed. Should bundling ever be turned off,
  the aliases have to be rewritten on emit or they ship broken.

  The trade-off taken knowingly: `lib/…` and `types/…` occupy npm's package-name space, so a real
  dependency named `lib` or `types` could not be imported, and an unconfigured tool reads such a
  specifier as an external package.

- `.prettierrc.json` sorts imports with `@ianvs/prettier-plugin-sort-imports`. The internal aliases
  need their own `importOrder` group — without it they land in `<THIRD_PARTY_MODULES>` among the npm
  packages. Side-effect imports are never reordered, which is what keeps the bare CSS imports in
  `src/index.ts` and `src/plugins/draw/index.ts` in place.
- Where every specifier of an import is a type, write a top-level `import type { … }`, never
  `import { type A, type B }`. With `verbatimModuleSyntax` the inline form leaves the statement in
  the output, which makes the bundler resolve type-only packages such as `geojson` at runtime and
  fail. oxlint enforces this via `consistent-type-imports` with `separate-type-imports`.

## Architecture

### Two component flavours, on purpose

**`MglSource.vue` / `MglLayer.vue` are the primary API.** They are generic SFCs
(`<script setup lang="ts" generic="T extends MglSourceKind">`), which is the only way to get `options`
narrowed by `type` all the way through to the consumer's template.

**Every component is an SFC** — all 41 of them, `<template>` first, then `<script setup lang="ts">`, then
`<style>` if any. Values that are not the component itself live in a sibling `.ts`, because an SFC can only
export the component: `buttonType.ts`, `controls/customControl.ts`, `controls/frameRateControl.ts`,
`controls/scaleControlUnit.ts`, `controls/controlEvents.ts`, `components/mapProps.ts`.

The package declares `sideEffects: ["*.css"]`, so tree-shaking is load-bearing — don't add module-level
side effects. Non-visual components (controls, `MglMarker`) render a comment-only template.

The `Mgl*Source` / `Mgl*Layer` files are **named shims** over the two generic components. They keep their
original flat props verbatim so existing templates compile unchanged, then collect them into `options`
(`LayerLib.pickLayerOptions`, or a local `pickOptions`) and render the generic component. They set
`inheritAttrs: false` and spread `ctx.attrs`, which is what forwards layer event listeners onto
`MglLayer`'s vnode — and they deliberately declare **no** `emits` for layer events, since declaring them
would consume the listeners instead of passing them on.

> `defineEmits` in an SFC cannot take a mapped type over a `.d.ts` from node_modules: `vue-tsc` resolves
> it, but the SFC compiler's own resolver does not and `vite build` fails in `extractRuntimeEmits`
> (the runtime emits array is generated at compile time). Hence `MglLayerEmits` in `layer.lib.ts` is
> spelled out and guarded by two `AssertNever` checks.

`MglStyleSwitchControl` carries a dummy `template` string purely for IDE slot code-assist — it is not compiled.

`MglStyleSwitchControl` carries a dummy `template` string purely for IDE slot code-assist — it is not compiled.

### provide/inject spine

`src/types.ts` holds the injection symbols. `MglMap` provides them all in `setup()`; everything beneath injects. This is the only channel between map and children — there is no prop drilling.

- `mapSymbol` — `ShallowRef<Map>` (undefined until mount)
- `isInitializedSymbol` — map object constructed; `MglMap` renders its default slot only after this flips, so children can assume `map.value` exists
- `isLoadedSymbol` — maplibre `load` fired; sources/layers gate all `addSource`/`addLayer` on this
- `componentIdSymbol` — the `MglMap` instance uid
- `sourceIdSymbol` — re-provided by each source component so nested layers bind to their enclosing source automatically
- `sourceLayerRegistry` — re-provided per source
- `sourceRegistrySymbol` — per-map `MglSourceRegistry` of source handles
- `controlRegistrySymbol` — per-map `ControlRegistry`, filled by `usePositionWatcher`
- `emitterSymbol` — per-map `mitt<MglEvents>` emitter
- `fitBoundsOptionsSymbol` — shared with the draw plugin for viewport padding

### Source/layer lifecycle and style switching

The trickiest part of the codebase. Sequence:

1. `MglSource` adds the source when `isLoaded` becomes true **and** on every maplibre `style.load`, then
   writes the resolved `Source` into the handle from `MglSourceRegistry.get(sourceId)`.
2. **`MglSourceRegistry` (`src/lib/sourceRegistry.ts`) is per map**, provided by `MglMap`. `MglLayer` asks
   the same registry for its source id, which is how a layer waits for its source without being handed it
   as a prop. It replaced a module-global `SourceLib.REFS` keyed by `String(componentUid) + sourceId` that
   was never pruned and collapsed every non-string source onto one shared entry.
3. The handle is **tri-state and that is load-bearing**: a `Source` means ready, `null` means "wait"
   (not added yet, or torn down by a style switch), `undefined` means there is nothing to wait for.
   `MglLayer` adds its layer when the value is a `Source` **or** `undefined`, and holds off on `null`.
4. `SourceLayerRegistry` (`src/lib/sourceLayer.registry.ts`) lets each layer register an unmount handler
   with its parent source, so a source removes its layers before removing itself — maplibre requires that order.
5. Switching styles: `MglStyleSwitchControl` emits `styleSwitched` on the mitt emitter → `MglMap` calls
   `sourceRegistry.resetAll()` and each source resets its own handle → layers see `null` and drop their
   handles → maplibre fires `style.load` → sources re-add → layers re-add. `setStyle` runs with
   `{ diff: false }` deliberately (maplibre-gl-js#2587: `style.load` isn't fired reliably with diffing).

When touching this flow, keep in mind that layers/sources must survive an arbitrary number of style
switches without leaking layer ids.

### Reactive diffing

Sources and layers apply option changes to the **live** maplibre object; they are no longer add-only.
Before this, changing `paint`/`layout`/`filter`/zoom range at runtime silently did nothing, and sources
only reacted through a handful of hand-written per-component watchers.

- `lib/layerDiff.ts` — `paint` and `layout` are diffed **per property** (`setPaintProperty` is the only
  granularity maplibre offers, and re-setting everything would restart transitions), `filter` →
  `setFilter`, `minzoom`/`maxzoom` → `setLayerZoomRange`. A change to `source-layer` or `metadata` has no
  setter, so `applyLayerDiff` returns `false` and the caller recreates the layer.
- `lib/sourceDiff.ts` — per source kind, which keys have an in-place setter. Anything else means
  remove + re-add (and the layers follow). The async v6 setters' promises are handed back in
  `SourceDiffResult.pending`, and `MglSource` routes a rejection to the map's `error` event instead of
  dropping it.

### CSS

Everything sits in a named cascade layer (`vue-maplibre-gl`, `vue-maplibre-gl-draw`) and every value worth
changing is a `--mgl-*` custom property **scoped to `.mgl-container`**, not `:root` — so two maps on one
page can be themed differently and the library never writes to the global scope.

Two deliberate omissions, both about not imposing on the consumer:

- **No `light-dark()`.** lightningcss downlevels it into `--lightningcss-light`/`--lightningcss-dark`
  helper variables that would land in every consumer's `.mgl-container` scope, and it offers no way to
  _force_ a theme. Dark mode is a `@media (prefers-color-scheme: dark)` block plus a `data-mgl-theme`
  attribute hook that overrides in both directions.
- **No `color-scheme`.** It changes how the browser paints UA widgets and scrollbars inside the container,
  which is the application's decision. It was only ever needed to make `light-dark()` resolve.

Class names are all `mgl-` or maplibre's own `maplibregl-`, so nothing can collide with a Tailwind
utility. The theming recipes (token override, Tailwind `@theme`, layer ordering) are documented at the
bottom of `src/css/index.css`.

### Declarative style settings

`MglTerrain`, `MglSky`, `MglLight`, `MglProjection`, `MglImage` and `MglGlobalState` are a few lines each
because they all sit on `composable/useStyleSetting.ts`.

`setTerrain`/`setSky`/`setLight`/`setProjection`/`setGlobalStateProperty`/`addImage` share an awkward
lifecycle: they only work once the style has loaded, **and** every style switch wipes them, so they must be
re-applied on `style.load`. Getting that second half wrong is the usual reason declarative terrain wrappers
stop working the moment a style is swapped. Add new style-level settings through that composable, not by
hand.

`MglTerrain` (always-on style setting) and `MglTerrainControl` (a button that toggles it) are different
things — do not merge them.

### Marker and popup

`useMarker` `provide()`s its marker, and `usePopup` injects it. That is the whole mechanism behind
`<MglPopup>` nested in `<MglMarker>`: with a marker present the popup calls `marker.setPopup()` and must
**not** add itself to the map, because maplibre toggles it from the marker. Without one it adds itself.

Both keep their DOM in a detached element that the slot teleports into — maplibre takes ownership of the
node (`Marker`'s `element`, `Popup.setDOMContent`), so it cannot be a normal rendered child.

### Two-way camera binding

`v-model:center|zoom|bearing|pitch|roll|bounds`, via `composable/useCameraModel.ts`.

The loop guard works by **origin, not by value**: every prop-driven camera change calls
`markProgrammatic()`, and the next settle event consumes that flag instead of emitting. Comparing the
emitted value against the prop does not work — maplibre clamps and rounds what it is given (`zoomSnap`,
`maxBounds`), so the value coming back legitimately differs from the one going in.

Bindings listen on the `*end` events (`moveend`, `zoomend`, …), never the continuous ones, and nothing is
bound at all for a model the consumer did not `v-model`.

### Props are derived from maplibre types, and that is enforced

Props are named 1:1 after maplibre options, and options objects are built by filtering
`Object.keys(props)` against a key list. **Every one of those lists is now proven complete at compile
time** — never hand-maintain them.

`src/types/exhaustive.ts` provides the machinery:

| Helper                              | Purpose                                                    |
| ----------------------------------- | ---------------------------------------------------------- |
| `keysOf<T>({ … })`                  | compile-time-exhaustive key list of `T` as a runtime array |
| `keysOfExcept<T, E>({ … }, except)` | same, minus keys that must not become props                |
| `AssertNever<T>`                    | proves a union is empty; used for prop-coverage checks     |

Applied at:

- `MapLib.MAP_OPTION_KEYS` = `keysOfExcept<MapOptions>` (minus `container`/`style`, plus `mapStyle`),
  `MapLib.MARKER_OPTION_KEYS` = `keysOf<MarkerOptions>`,
  `MapLib.MAP_EVENT_TYPES` = `keysOf<MapEventType>` (`src/lib/map.lib.ts`)
- `LayerLib.LAYER_OPTION_KEYS` = `keysOf<Record<LayerOptionProp, unknown>>`, where `LayerOptionProp`
  is a _distributive_ `keyof` over the `LayerSpecification` union — so it covers `color-relief`, which
  the previous nine-way intersection silently omitted. `LayerLib.LAYER_EVENTS` = `keysOf<MapLayerEventType>`,
  and `SHARED.emits` is derived from it rather than duplicated (`src/lib/layer.lib.ts`)
- per-source `keysOf<MglSourceOptions<'geojson'>>({ … })` at the top of each `src/components/sources/*.ts`
- `MglMap`'s props live in a standalone `mapProps` const so `_MapOptionsAreFullyCovered` can assert via
  `AssertNever` that **every** `MapOptions` key has a prop

Two independent gates therefore fire when maplibre-gl adds an option: `keysOf` rejects the incomplete
key list, and `AssertNever` names the option that has no prop. Same for events. Both were verified to
actually fail by temporarily deleting a prop and a key.

Generic spec types live in `src/types/{source,layer}.ts` — `MglSourceKind`/`MglSourceOptions<T>` and
`MglLayerKind`/`MglLayerOptions<T>`/`MglLayerPaint<T>`/`MglLayerLayout<T>`/`MglLayerFilter<T>`.
**Always use these instead of `SourceSpecification` directly:** `CanvasSourceSpecification` is not part
of that union, so `SourceSpecification['type']` silently loses `'canvas'`.

`AllOptions`/`AllProps`/`AllSourceOptions` remain as `@deprecated` aliases for consumers.

Two renames to remember: prop `mapStyle` → maplibre option `style` (mapped in `MglMap.initialize()`), and prop `sourceLayer` → `source-layer` (mapped in `LayerLib.genLayerOpts`).

No TS `enum` anywhere: `Position`, `DrawMode`, `ButtonType` and `ScaleControlUnit` are `const` objects
plus a same-named type. `Position.TOP_RIGHT` and `v: Position` are unchanged, raw strings are now also
accepted, and `erasableSyntaxOnly` is satisfied. Do not reintroduce enums or parameter properties.

### Events

- **Map events** are emitted as `map:<maplibre event>` (e.g. `@map:click`). `MglMap` binds a handler on the maplibre map _only if_ `component.vnode.props['onMap:<event>']` exists, so unused events cost nothing. Payload is `MglEvent` — `{ type, map, component, event }`, not the raw maplibre event. Adding an event requires touching both `MapLib.MAP_EVENT_TYPES` and the `emits` array of `map.component.ts`.
- **Layer events** are unprefixed (`@click`, `@mouseenter`, …), listed in `LayerLib.LAYER_EVENTS`, and bound/unbound by `LayerLib.register/unregisterLayerEvents` by reading `ci.vnode.props` directly rather than through Vue's emit system (they need maplibre's `(event, layerId, handler)` signature).

### Global map registry

`src/lib/mapRegistry.ts` keeps a module-level `Map<string|symbol, MapInstance>` of reactive instances. `MglMap` registers itself under its `mapKey` prop (or a default symbol); consumers anywhere call `useMap(key)` to get `{ component, map, isMounted, isLoaded, language }`. `language` is writeable through the registry — `MglMap` watches both the prop and the registry entry, so either can drive the change.

### Defaults

`MglDefaults` (`src/defaults.ts`) is a **reactive** options object. Every `MglMap` prop defaults through `() => defaults.<key>`, so apps can mutate `MglDefaults` before mounting to set library-wide defaults.

### Language switching

`setPrimaryLanguage` (`src/lib/language.ts`) walks all symbol layers and rewrites `text-field` expressions into `['coalesce', ['get', 'name:xx'], ['get', 'name']]`. It handles raw `{name}` template strings and nested `get`/`concat`/`format`/`case` expressions.

### WebGL context recovery

`MglMap` listens for `webglcontextlost` on the canvas and does a full `dispose()` + `nextTick(initialize)`. Any state added to `MglMap` must be re-created by `initialize()` and torn down by `dispose()` — they are called repeatedly over a component's life, not once.

## Tests

`pnpm test` runs the `unit` and `ssr` projects; `pnpm test:coverage` adds the 100 % gate (**not met yet**
— see below); `pnpm test:browser` runs the third project, which needs a Chromium download
(`playwright install chromium --with-deps`).

| Project   | Environment                      | Purpose                                                     |
| --------- | -------------------------------- | ----------------------------------------------------------- |
| `unit`    | jsdom + `test/fake-map.ts`       | the coverage gate: lifecycle, diffing, registries, teardown |
| `ssr`     | node, **no DOM**                 | proves the package imports and renders server-side          |
| `browser` | real Chromium, **real maplibre** | catches maplibre API drift, which no mocked test ever can   |

- **`test/fake-map.ts`** implements exactly the maplibre surface this library uses, fires events
  **synchronously**, and keeps real style state. It _throws_ when a source is removed while a layer still
  references it — so the ordering test is enforced, not merely asserted. Extend the fake rather than
  reaching for the real `Map`, which needs WebGL and workers.
- **Reach the map via `FakeMap.last`**, never `wrapper.vm.map`: what a `<script setup>` component exposes
  goes through a ref-unwrapping proxy whose shape depends on Vue internals.
- **Always unmount** mounted wrappers. All tests share the default map key, so a leaked registration
  pollutes the next test's baseline.
- Marker and popup slots teleport into a **detached** element that maplibre owns, so `wrapper.text()`
  cannot see them — assert on the exposed instance's element instead.
- The `ssr` project is the only place a server-side DOM access can be caught; jsdom provides `window`, so
  a unit test never will.

### The `browser` project

**75 smoke tests over every base feature** — all seven source kinds, all ten layer kinds, all eleven
controls, the six style settings, marker and popup, the composables, the map registry, language switching
and the three draw modes. They exist for the one thing the other two projects cannot do: notice when
maplibre changes the shape of its API, because everything else mocks it. Things to know:

- **It must not have `setupFiles`.** The whole point is the real `maplibre-gl`.
- **Software WebGL.** Headless Chromium has no GPU and maplibre will not start without a context, so the
  launch args carry `--enable-unsafe-swiftshader`.
- **Never wait for `map.loaded()`.** It also requires the map to be _idle_, and under a software renderer
  it stays dirty, so it never returns true — every test timed out on it while the library was working.
  Wait for the `@map:load` event instead.

- **maplibre is excluded from dep optimisation.** v6 loads its worker through `import.meta.url` from a
  separate chunk, which the optimizer cannot pre-bundle: it warns and then serves a file that is not there.
- **Reading style properties during a switch throws.** The style is briefly gone while maplibre swaps it,
  so anything that polls has to gate on `isStyleLoaded()` first — which v6 types as `boolean | void`.
- **A `ref` is required to drive an update.** The children thunk is a render function, so only a reactive
  read makes Vue re-run it; a mutated plain variable changes nothing and the test silently proves nothing.

No tile server is involved (`test/browser/style.ts` holds complete inline styles), so the suite runs
offline. Shared scaffolding is in `test/browser/helpers.ts`.

What the browser suite has caught so far, none of which any mocked test could: `:options` on the named
wrappers (they take flat props), `MglImage` being handed a URL where maplibre wants a bitmap, and
`useLayer` in the same `setup()` as `useSource` (whose `provide()` only reaches descendants).

Coverage is at ~79 %, up from 41 %. What is left below 60 % is `circleStatic.mode.ts`, `circle.mode.ts`,
`frameRateControl.ts` and the deprecated `useDisposableLayer.ts`. Whether 100 % is the right target is an
open question: some of the remaining branches need real touch events or a real GPU.

## Draw plugin (`src/plugins/draw/`)

`DrawPlugin` is a framework-agnostic class driving maplibre directly; `MglDrawControl` (`draw.control.ts`) is a thin Vue wrapper around it and doubles as the reference example for using the plugin standalone. It wraps the plugin instance in `reactive()` so `draw.mode` renders.

- One geojson source (`DrawPlugin.SOURCE_ID = 'mgl-draw-plugin'`) plus layers generated from `DefaultDrawStyles` (`styles.ts`); consumers can swap the whole style array.
- Modes extend `AbstractDrawMode` (`mode.abstract.ts`) implementing `register`/`unregister`/`setModel`/`onOptionsUpdate`. `setMode` unregisters + clears the old instance before constructing the new one.
- `POLYGON` and `CIRCLE` draw real geometry into the source. `CIRCLE_STATIC` is different in kind: it builds **DOM elements** (`html.ts` + `draw.plugin.scss`) pinned to the viewport and converts to geometry on viewport change — style it with CSS, not paint properties.
- The model is always a closed `Feature<Polygon, DrawFeatureProperties>`; `prepareModel` clones input and closes the ring. Properties carry `center`/`radius`/`area`/`tooSmall`/`meta`, which the default styles filter on.
- `minArea` renders a hatch pattern drawn to a canvas and registered as a maplibre image (`MIN_AREA_PATTERN_ID`).
- Pointer hit-testing uses `pointerPrecision` (mouse 24px / touch 36px) via `isNearby`, not maplibre feature queries.

## Docs and IDE metadata

`docs/` is a VitePress 2 site (still alpha) that consumes the library from source through the same alias
set as the playground, so a library edit hot-reloads in the demos. `pnpm docs:dev` / `pnpm docs:build`.

**Never hand-write a prop, event or slot table.** `scripts/gen-meta.mjs` (`pnpm meta`) runs
`vue-component-meta` over the components and emits two artefacts from that one source:

| Artefact                                    | Consumer                                    |
| ------------------------------------------- | ------------------------------------------- |
| `docs/.vitepress/generated/components.json` | the `<ApiTable name="…" />` theme component |
| `packages/vue-maplibre-gl/web-types.json`   | JetBrains IDEs (shipped in the tarball)     |

Both are **generated and committed** — regenerate with `pnpm meta` after touching a prop, an event, a
slot or a doc comment; `docs:dev` and `docs:build` run it themselves. Editing either by hand is pointless,
it is overwritten. Freshness is not yet asserted in CI (phase 9).

Three things about the generator that are not obvious:

- The component list comes from the **barrels** (`components/index.ts`, `plugins/draw/index.ts`), not a
  glob: those define the public names, and `install()` registers exactly them. Not exported means not
  documented.
- The named layer wrappers declare no `emits`, so the checker reports **zero events** for them. The
  generator copies `MglLayer`'s events onto them and marks them `forwarded`, because
  `<MglFillLayer @click>` does work — via `$attrs`. Without that the docs would lie by omission.
- `MglMap`'s event payloads come out as `any[]`, because its emits are a runtime array
  (`keysOf`-derived). The real payload is always `MglEvent`. Spelling the emits out as a type — the
  `MglLayerEmits` treatment — would fix it and is the one remaining typing gap of note.

Doc comments on props are the input to all of this: one JSDoc line lands in the emitted d.ts, in the IDE
and on the website at once. **All 330 props carry one** — `pnpm meta` prints the number that do not, so a
new prop without a comment is visible on the next run. Keep it at zero.

Two things worth knowing when adding one:

- It must be a `/** … */` block. A plain `/* … */` above a prop is invisible to the checker — two props
  had one and read as undocumented.
- **Event descriptions cannot be generated.** Props and slots carry their JSDoc into the metadata; emits
  do not, because they are declared as a type and `vue-component-meta` keeps only the payload type —
  measured with the JSDoc both inline and imported. The comments on `MglLayerEmits` and friends are still
  worth having (editor hover), but the prose that explains an event has to live in the guide pages.
- JSDoc on a **shared** prop definition propagates. `LayerLib.SHARED.props` is documented once and shows
  up on all ten named layer wrappers. `positionProp()` is the counter-example: it _returns_ the prop
  definition, so there is no property to annotate and each control documents `position` itself.

## CI and release

Three workflows, all on pnpm with `--frozen-lockfile`:

| Workflow      | Trigger            | Does                                                               |
| ------------- | ------------------ | ------------------------------------------------------------------ |
| `ci.yml`      | push to master, PR | four jobs: quality, tests (node 20.19/22.12/24), build, docs       |
| `release.yml` | push to master     | changesets: opens the version PR, or publishes when one was merged |
| `docs.yml`    | push to master     | builds the docs and deploys to GitHub Pages                        |

The lint steps are listed individually rather than as `pnpm lint`, so a red run names the tool. Two checks
exist that a local `pnpm lint` does not do:

- **`pnpm meta` must produce no diff.** `web-types.json` ships in the tarball, so a stale one means the
  published IDE metadata describes an older API than the code. Run `pnpm meta` and commit whenever a prop,
  event, slot or doc comment changes — including after a **version bump**, since the version is embedded.
- **`dist/` must contain no `.cjs`.** maplibre-gl v6 has no `require` condition, so a CommonJS bundle here
  would be a file nobody can load.

**The coverage gate is deliberately not enforced in CI yet.** `vitest.config.ts` has the 100 % thresholds,
but actual coverage is ~41 %, so the step runs `pnpm test:coverage || true`. Drop the `|| true` when
phase 7 lands — the gate is in place, only the tests are missing.

Releases go through **changesets**: `pnpm changeset` to record one, and the workflow does the rest.
`changeset:version` also runs `pnpm meta` and `pnpm format`, because the bump changes `web-types.json`.
Publishing uses npm's OIDC trusted publishing plus `NPM_CONFIG_PROVENANCE`, so there is no token in the
repo — **that path has never actually run**; watch the first release and expect to adjust the auth step.

- **Whitespace is Prettier's job, not yours** — write it however, then `pnpm format`. See the
  _Commands_ section for the settings.
- Imports: see the _Imports_ section above (bare aliases inside the package, never a relative path, no `.ts` extensions, top-level `import type`).
- New public component: add to `src/components/index.ts` (which `src/index.ts` re-exports and the plugin `install` auto-registers by export name), give every prop a `/** … */` comment, then run `pnpm meta` — the barrel is also what the docs and `web-types.json` are generated from.
- **CSS is plain CSS, no preprocessor.** `src/css/index.css` (core) and
  `src/plugins/draw/draw.plugin.css` (the `CIRCLE_STATIC` DOM overlay). The old SCSS used nothing but
  nesting, which browsers do natively and lightningcss flattens for older targets. Do not reintroduce Sass.

## Gotchas

- **A layer must re-add itself on `style.load`.** Only `MglStyleSwitchControl` broadcasts `styleSwitched`
  (which resets source handles to `null`); a plain `map.setStyle()` — including a change to `MglMap`'s
  `mapStyle` prop, which goes through `applyMapOption` — fires `style.load` _without_ it. The handle then
  goes straight from the old `Source` to the new one, so watching it is not enough: `useLayer` subscribes to
  `style.load` itself and clears `isAdded` first. Without that, the source comes back and the layer is gone
  for good.
- **`useMglMap` disposes in `onUnmounted`, not `onBeforeUnmount`.** Vue runs `beforeUnmount` parent-first,
  so disposing there destroyed the map before nested sources and layers could tear down — their cleanup
  bails out on a missing `map.value`, silently skipping the removal order this library exists to guarantee.
- **A prop `default` is evaluated when the module is evaluated.** `MglFrameRateControl` had
  `default: 4 * window.devicePixelRatio`, which made the _entire package_ unimportable server-side, because
  the component barrel pulls that module in. Vue only treats a `default` as a factory for object and array
  types, so a number has no lazy form — leave the prop undefined and apply the default where it is consumed.

- `src/components/layers/smybol.layer.ts` — filename typo, intentional to preserve import paths. The component name is `MglSymbolLayer`.
- `useSource` / `useDisposableLayer` are `@deprecated` but still public and still work: they were rebuilt
  on the same per-map registry the components use. Do not add features to them — extend the components.
- Control components must **not** remove their control themselves; `usePositionWatcher` owns add, move,
  remove and `ControlRegistry` bookkeeping for all of them.
- `MglEvent.component` and `MapInstance.component` are typed `ComponentPublicInstance`, not
  `InstanceType<typeof MglMap>`: the precise type required importing the component barrel from
  `lib/`, which created a real `lib/ <-> components/` import cycle. `MglEvent`'s `C` type parameter
  lets consumers narrow it back.
- The draw plugin's `plugin.ts <-> *.mode.ts` and `mode.abstract.ts <-> plugin.ts` import cycles are
  `import type` only and therefore erased; `import/no-cycle` is a warning so new _runtime_ cycles
  still surface.
- **`window`/`document` must not be touched at module level** — that is what broke SSR:
  `AbstractDrawMode.isTouchEventSupported` was a class _field_ (`window !== undefined && …`), evaluated on
  import, and `window !== undefined` throws a `ReferenceError` server-side rather than being `false`
  (`typeof window` is the safe form). It is a lazy getter now. Inside a component `setup()` it is fine:
  `MglMap` gates its slot behind `v-if="isInitialized"`, which is never true during SSR, so children never
  run there.
- Control components with events must not derive their emits with a mapped type — same SFC-compiler limit
  as `MglLayerEmits`. See `controls/controlEvents.ts`, where `MglGeolocationEmits`/`MglFullscreenEmits` are
  written out and guarded by `AssertNever` pairs _plus_ a `satisfies` on the runtime name list.
- `debounce`/`throttle` (`lib/debounce.ts`) do **not** forward `this`. Every call site passes an
  already-bound function. Pass a closure, not a bare method.
- **`@types/geojson` is an _optional_ peer dependency, deliberately.** maplibre types GeoJSON as
  `GeoJSON.GeoJSON`, i.e. against the global UMD namespace, which TypeScript only exposes when the
  consumer includes it explicitly — installing it is not sufficient and `allowUmdGlobalAccess` does not
  help (both measured). Missing it degrades every GeoJSON type to `any`, _silently_, because of
  `skipLibCheck`. The package therefore does **not** inject a `/// <reference types="geojson" />` into the
  emitted d.ts: that would force strict mode on everyone and hard-fail anyone without the package. The
  choice is the consumer's and is documented under Installation in the package README.
- **maplibre v6: `GeoJSONSource.setData()` and `setClusterOptions()` return `Promise<void>`** (they
  returned `this` in v5). `setTiles`/`setUrl`/`setCoordinates`/`updateData`/`updateImage` stayed sync.
  Current call sites `void` the promise with a comment; phase 3 routes failures through the map's
  `error` event.
- `Map.on()` returns a `Subscription` in v6. `MglMap` collects them in an array and calls
  `unsubscribe()` on dispose — that replaced a `Map<string, Function>` keyed by event name with a
  `'__load'` sentinel that had to be stripped with `substring(2)`.
- `LayerLib.SHARED.props.interactive` is `@deprecated` and ignored: `interactive` is not a maplibre
  layer specification key and used to be forwarded into `addLayer` as an unknown property. `ref` was in
  the old key list too, equally bogus, and is gone.
- `noUncheckedIndexedAccess` is **off** (`tsconfig.base.json` explains why): enabling it produces **184**
  errors, all in the draw plugin's geometry code, 156 of them `Object is possibly 'undefined'` on ring and
  feature indexing. Everything outside `plugins/draw` already satisfies it. The plugin's _surface_ is
  tested now, but the pointer sequences in `polygon.mode.ts` and `circle.mode.ts` are not — those tests
  come before the refactor, not after.
