# Getting started

Assuming the [installation](/guide/installation) is done, a map is one component with a height:

```vue
<template>
  <MglMap map-style="https://demotiles.maplibre.org/style.json" :center="[7.1, 50.7]" :zoom="4" style="height: 360px" />
</template>

<script setup lang="ts">
import { MglMap } from 'vue-maplibre-gl';
</script>
```

<DemoMap />

`MglMap` has no intrinsic size — give it a height, or it collapses. It watches its container with a
`ResizeObserver`, so a layout change resizes the map without you calling `resize()`.

## The prop names are maplibre's option names

Every prop on `MglMap` is named exactly after the [maplibre `MapOptions`](https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapOptions/)
key it sets, with one deliberate exception: `style` is called **`mapStyle`**, because `style` is taken by
the HTML attribute.

That mapping is enforced at compile time rather than by convention — see [the Map API](/api/map).

## Adding data

A source holds the data, a layer draws it. Nest the layer inside the source and it binds automatically:

```vue
<template>
  <MglMap map-style="https://demotiles.maplibre.org/style.json" :zoom="3" style="height: 360px">
    <MglGeoJsonSource source-id="places" :data="places">
      <MglCircleLayer layer-id="places-circles" :paint="{ 'circle-radius': 6, 'circle-color': '#2f7fd8' }" @click="onClick" />
    </MglGeoJsonSource>
  </MglMap>
</template>

<script setup lang="ts">
import type { MapLayerMouseEvent } from 'maplibre-gl';
import { MglCircleLayer, MglGeoJsonSource, MglMap } from 'vue-maplibre-gl';

const places = {
  type: 'FeatureCollection',
  features: [{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [7.1, 50.7] } }]
};

function onClick(event: MapLayerMouseEvent) {
  console.log(event.features?.[0]);
}
</script>
```

Three things are happening that are worth knowing about:

1. **The layer waits for its source.** It does not need to be told which one — the enclosing source
   provides its id, and the layer holds off until maplibre reports the source as ready.
2. **Teardown order is guaranteed.** maplibre refuses to remove a source that a layer still references.
   Layers register an unmount handler with their source, so they always go first.
3. **`@click` is a maplibre layer event**, not a DOM event. It is bound with maplibre's
   `(event, layerId, handler)` signature and only fires for features of _this_ layer.

`places` above is reactive: assign a new `FeatureCollection` and the source calls `setData` rather than
being torn down and rebuilt. See [sources & layers](/guide/sources-and-layers).

## Map events are prefixed

Map events carry a `map:` prefix, so they cannot collide with layer events or DOM events:

```vue
<MglMap @map:load="onLoad" @map:moveend="onMoveEnd" />
```

The payload is an `MglEvent` — `{ type, map, component, event }` — not the raw maplibre event, so you get
the map and the emitting component without a template ref. A handler is only attached to the maplibre map
if you actually bound the event, so the 61 unused ones cost nothing.

## Reading the map instance

Three ways, in ascending order of decoupling:

```vue
<!-- 1. a template ref -->
<MglMap ref="mapRef" />
```

```ts
// 2. anywhere in the subtree
import { useMap } from 'vue-maplibre-gl';

const { map, isLoaded } = useMap();
```

```ts
// 3. anywhere at all, by key
const { map } = useMap('overview'); // <MglMap map-key="overview">
```

`useMap()` returns a reactive registry entry: `{ component, map, isMounted, isLoaded, language }`.
`map` is `undefined` until the map is constructed, so gate on `isLoaded` before touching maplibre.

## Where to go next

- [Sources & layers](/guide/sources-and-layers) — generic vs. named components, and how updates are applied
- [Composables](/guide/composables) — the same features without this library's components
- [Camera binding](/guide/camera) — `v-model:center`, `v-model:zoom`, …
- [Style switching](/guide/style-switching) — what happens to your layers when the style changes
