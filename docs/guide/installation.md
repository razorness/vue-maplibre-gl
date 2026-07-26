# Installation

```sh
pnpm add vue-maplibre-gl maplibre-gl mitt
```

`vue`, `maplibre-gl` and `mitt` are peer dependencies — the package externalises them so your app has
exactly one copy of each.

## ESM only

This package ships **no CommonJS build**, and that is not a stylistic choice: maplibre-gl v6 publishes
no `require` condition and no `main` field, so `require('maplibre-gl')` is impossible. A CJS build of
this package could not load its own peer dependency. `dist/` contains `index.js`, `draw.js`, the two
stylesheets and the bundled type declarations.

Your bundler must also be able to resolve maplibre v6's worker, which it loads through
`import.meta.url`. Vite, Rollup, webpack 5, esbuild and Parcel all handle this.

## Register the components

Either globally, through the plugin:

```ts
import { createApp } from 'vue';
import VueMaplibreGl from 'vue-maplibre-gl';
import 'vue-maplibre-gl/style.css';
import 'maplibre-gl/dist/maplibre-gl.css';

createApp(App).use(VueMaplibreGl).mount('#app');
```

…or per component, which is what lets the bundler drop what you do not use:

```vue
<script setup lang="ts">
import { MglFillLayer, MglGeoJsonSource, MglMap } from 'vue-maplibre-gl';
</script>
```

Both stylesheets are needed: maplibre's own, and this package's — the latter styles the controls this
library adds.

::: tip Tree shaking
The package declares `sideEffects: ["*.css"]`, and every component is marked `/*#__PURE__*/`. Importing
individual components therefore drops the rest. The draw plugin is behind its own subpath so that
`@turf/*` never enters your main bundle — see [the draw plugin](/draw/).
:::

## GeoJSON types: strict or loose {#geojson}

**This is the one setup detail worth reading carefully.** It decides whether `data` on a GeoJSON source
is properly typed or silently `any`.

maplibre types GeoJSON against the **global UMD namespace** `GeoJSON`, which comes from
`@types/geojson`. TypeScript only exposes that namespace when your project includes it _explicitly_ —
having the package in `node_modules` is not enough, and `allowUmdGlobalAccess` does not help either.
Both were measured, not assumed.

Because `skipLibCheck` is normally on, a missing namespace does not produce an error. It degrades every
GeoJSON type to `any`, quietly:

```ts
// without the reference: `data` is `any`, this compiles
<MglGeoJsonSource source-id="x" :data="{ type: 'Nonsense' }" />
```

`@types/geojson` is therefore an **optional peer dependency** — you choose:

### Strict (recommended)

```sh
pnpm add -D @types/geojson
```

```ts
// env.d.ts (or any .d.ts in your project)
/// <reference types="geojson" />
```

`FeatureCollection`, `Feature`, `Geometry` and friends now type-check inside `:options`, and the
example above becomes an error.

### Loose

Install nothing. GeoJSON values are `any`. Everything still compiles and runs — you simply get no
checking for that one part of the surface.

::: details Why the package does not just inject the reference
Emitting `/// <reference types="geojson" />` into the shipped `.d.ts` would force the strict mode on
every consumer, and hard-fail anyone who has not installed the package — including JavaScript users who
never asked for it. Leaving the choice with you is the only option that cannot break someone's build.
:::

## TypeScript

Nothing to configure beyond the above. The bundled declarations reference only `vue`, `maplibre-gl`,
`mitt` and `geojson`, so no internal paths leak into your project.

For the best editor experience:

- **VS Code** — the [Vue extension (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.volar)
  narrows `<MglSource type="geojson" :options="…">` in the template, so a `tiles` array on a geojson
  source is flagged where you write it.
- **JetBrains IDEs** — the package ships `web-types.json`, generated from the same component metadata
  as this reference, so props, events and slots complete with their documentation. No setup needed.

## Nuxt / SSR

The package is server-safe: no module-level `window` or `document` access, and `MglMap` renders only its
container until mounted. See [SSR & Nuxt](/guide/ssr).
