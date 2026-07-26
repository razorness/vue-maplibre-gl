# Composables

Every base feature of maplibre is available two ways: as a component, or as a composable. The components
_are_ the composables — `MglMap` is a thin wrapper over `useMglMap()`, `MglSource` over `useSource()`,
`MglLayer` over `useLayer()`. Nothing is component-only except the controls, which have to render.

Reach for the composables when you want your own component, your own container element, or when you are
working against a maplibre map this library did not create.

## `useMglMap()`

The whole map lifecycle against a container you own:

```vue
<template>
  <div ref="container" class="map" />
  <MglNavigationControl v-if="isInitialized" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { MglNavigationControl, useMglMap } from 'vue-maplibre-gl';

const container = ref<HTMLDivElement>();
const zoom = ref(4);

const { map, isInitialized, isLoaded, restart, dispose } = useMglMap({
  container,
  options: () => ({ style: 'https://demotiles.maplibre.org/style.json', center: [7.1, 50.7], zoom: zoom.value })
});
</script>
```

`options` is a getter, so it is reactive: options that have a maplibre setter are applied to the live map,
the rest are read once at construction. Everything the component does, this does — the provide spine for
nested sources and layers, language rewriting, resetting source handles on a style switch, resizing with
the container, full teardown and rebuild on WebGL context loss, and registration in the global map
registry.

`container` accepts a ref, a getter or a plain element (`MaybeRefOrGetter`). It may start out empty — the
map is created in `onMounted`, by which time a template ref has resolved.

## `useSource()` / `useLayer()`

```ts
import { useLayer, useSource } from 'vue-maplibre-gl';

const { source, isReady, recreate } = useSource({
  sourceId: 'earthquakes',
  type: 'geojson',
  options: () => ({ data: data.value, cluster: true })
});

const { isAdded, add, remove } = useLayer({
  layerId: 'quakes',
  type: 'circle',
  options: () => ({ paint: { 'circle-radius': radius.value } })
});
```

Called inside a `<MglMap>` subtree they find the map through injection. Outside one, pass it:

```ts
const map = shallowRef<Map>(); // a plain maplibre map you created yourself
useSource({ sourceId: 'x', type: 'geojson', options: () => ({ data }), map });
```

`useSource()` also `provide()`s its source id and layer registry, so `useLayer()` and `<MglLayer>` inside
the same component tree bind to it automatically — the nesting behaviour is not a component feature.

::: details Why there is one overload per source and layer kind
`options` is typed `MglSourceOptions<T>`, which is `Extract<Union, { type: T }>` under the hood. While `T`
is still an unresolved type _parameter_, TypeScript cannot evaluate that, so an inline `options` literal
gets no contextual type: `type: 'FeatureCollection'` widens to `string` and stops matching GeoJSON. One
concrete overload per kind makes the type real at the call site. A trailing generic overload keeps a
dynamically computed kind callable.
:::

## `useMarker()` / `usePopup()`

```ts
const { marker, element } = useMarker({ coordinates: () => coords.value, options: { draggable: true } });
const { popup } = usePopup({ coordinates: () => coords.value, options: { closeOnClick: false } });
```

`useMarker()` provides its marker; `usePopup()` injects it. That is the entire mechanism behind a popup
nested in a marker — with a marker present, the popup registers through `marker.setPopup()` and must not
add itself to the map, because maplibre toggles it from the marker.

Both keep their DOM in a detached element you teleport into, since maplibre takes ownership of the node.

## Events

```ts
import { onMapLoad, useLayerEvent, useMapEvent } from 'vue-maplibre-gl';

useMapEvent('moveend', event => console.log(event.target.getCenter()));
useLayerEvent('click', 'quakes', event => console.log(event.features));
onMapLoad(map => map.setPadding({ top: 40 }));
```

All three unsubscribe with the owning scope and accept an explicit map as their last argument.

## Queries

```ts
const { features, refresh } = useQueryRenderedFeatures({ layers: ['quakes'] });
```

Re-queries on `idle` so the result reflects what is actually rendered.

## The global registry

```ts
import { useMap } from 'vue-maplibre-gl';

const { component, map, isMounted, isLoaded, language } = useMap(); // the default map
const overview = useMap('overview'); // <MglMap map-key="overview">
```

A reactive entry per mounted map, so any component anywhere can reach a map without prop drilling or
injection. `language` is writeable through the registry: `MglMap` watches both its prop and the registry
entry, so either can drive the change.

## Deprecated

`useSource` had a different signature in v5, and `useDisposableLayer` existed alongside it. Both still
work — they were rebuilt on the same per-map registry the components use — but they are `@deprecated` and
will not gain features. Use `useSource()` with the options object shown above, and `useLayer()`.
