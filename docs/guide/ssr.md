# SSR & Nuxt

The package is server-safe. Importing it in Node does not throw, and rendering a page that contains
`MglMap` produces the container element and nothing more.

## What makes it safe

- **No `window` or `document` access at module level.** This is the failure mode that breaks most map
  wrappers, and it is subtle: `window !== undefined` throws a `ReferenceError` on the server rather than
  being `false` — only `typeof window` is safe. The draw plugin's touch detection was a class _field_
  evaluating exactly that on import; it is a lazy getter now.
- **A prop `default` is evaluated when the module is evaluated.** `MglFrameRateControl` had
  `default: 4 * window.devicePixelRatio`, which made the _entire package_ unimportable server-side,
  because the component barrel pulls that module in. Vue only treats a `default` as a factory for object
  and array types, so a number has no lazy form — the default is applied where it is consumed instead.
- **`MglMap` gates its default slot behind `isInitialized`**, which is never true during SSR. Children —
  sources, layers, markers, controls — therefore never run on the server at all.

This is verified by a dedicated test project that runs in a **`node` environment with no DOM**. A jsdom
test can never catch a server-side DOM access, because jsdom provides `window`.

## Your own components

If you build on the composables, keep the same discipline:

```ts
// runs on the server too — guard it
const supportsTouch = typeof window !== 'undefined' && 'ontouchstart' in window;
```

Inside a component `setup()` under `MglMap` you need no guard, since that subtree never renders on the
server.

## Nuxt

There is no Nuxt module yet. It works without one:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  css: ['maplibre-gl/dist/maplibre-gl.css', 'vue-maplibre-gl/style.css']
});
```

```vue
<template>
  <ClientOnly>
    <MglMap map-style="https://demotiles.maplibre.org/style.json" style="height: 400px" />
  </ClientOnly>
</template>

<script setup lang="ts">
import { MglMap } from 'vue-maplibre-gl';
</script>
```

`ClientOnly` is not strictly required — the map renders its container on the server and initialises on the
client — but it keeps the server output free of an empty map container if that matters to your layout.

A module providing auto-imports and the CSS injection is planned, not promised.
