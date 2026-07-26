# Composables

Hand-written, because these are functions rather than components — `vue-component-meta` only sees the
latter. See [the composables guide](/guide/composables) for what to use when.

## Map

```ts
function useMglMap(opts: UseMglMapOptions): UseMglMapReturn;
```

| Option             | Type                                              | Purpose                                                   |
| ------------------ | ------------------------------------------------- | --------------------------------------------------------- |
| `container`        | `MaybeRefOrGetter<HTMLElement \| null>`           | element the map renders into; may start out empty         |
| `options`          | `MaybeRefOrGetter<Omit<MapOptions, 'container'>>` | maplibre options; reactive for anything with a setter     |
| `mapKey`           | `string \| symbol`                                | key for `useMap(key)`                                     |
| `language`         | `MaybeRefOrGetter<ValidLanguages>`                | rewrites every symbol layer's `text-field`                |
| `fitBoundsOptions` | `MaybeRefOrGetter<FitBoundsOptions>`              | padding for `bounds` updates, shared with the draw plugin |
| `projection`       | `MaybeRefOrGetter<ProjectionSpecification>`       | applied through `setProjection` once the style is ready   |
| `events`           | `ReadonlyArray<keyof MapEventType>`               | which events to subscribe to                              |
| `onEvent`          | `(event, payload: MglEvent) => void`              | receives them                                             |
| `camera`           | `CameraModelBinding`                              | two-way camera binding                                    |
| `observeResize`    | `boolean`                                         | keep the map sized to its container; default `true`       |

Returns `{ map, isInitialized, isLoaded, emitter, sourceRegistry, controlRegistry, registryItem, restart, dispose }`.

```ts
function useMap(key?: string | symbol): MapInstance;
```

Reactive registry entry: `{ component, map, isMounted, isLoaded, language }`.

## Sources and layers

```ts
function useSource(opts: UseSourceOptions<T>): UseSourceReturn;
function useLayer(opts: UseLayerOptions<T>): UseLayerReturn;
```

`UseSourceOptions` takes `sourceId`, `type`, `options` (a getter), and optionally `map`.
Returns `{ source, isReady, layerRegistry, recreate }`, where `source` is the tri-state handle described
under [sources & layers](/guide/sources-and-layers).

`UseLayerOptions` takes `layerId`, `type`, `options`, and optionally `source`, `before`, `instance`, `map`.
Returns `{ isAdded, add, remove }`.

Both are declared with one concrete overload per kind plus a generic fallback, so an inline `options`
literal narrows correctly.

## Marker and popup

```ts
function useMarker(opts: UseMarkerOptions): UseMarkerReturn; // { marker, element, ... }
function usePopup(opts: UsePopupOptions): UsePopupReturn; // { popup, element, ... }
```

`useMarker` provides its marker; `usePopup` injects it and attaches through `setPopup()` when one is present.

## Events and queries

```ts
function useMapEvent<T extends keyof MapEventType>(event: T, handler: (ev: MapEventType[T]) => void, map?: MapOrRef): void;
function useLayerEvent<T extends keyof MapLayerEventType>(
  event: T,
  layerId: string,
  handler: (ev: MapLayerEventType[T]) => void,
  map?: MapOrRef
): void;
function onMapLoad(handler: (map: Map) => void, map?: MapOrRef): void;
function useQueryRenderedFeatures(opts): UseQueryRenderedFeaturesReturn;
```

`MapOrRef` is `Map | ShallowRef<Map | undefined> | Ref<Map | undefined>` — pass a raw maplibre map, a ref to
one, or omit it to use the enclosing `MglMap`.

## Style settings

```ts
function useStyleSetting(opts): void;
```

Applies a style-level setting once the style has loaded and re-applies it on every `style.load`. This is what
the six [style components](/api/style) are built on; use it for settings of your own rather than calling
`setTerrain` and friends directly.

## Deprecated

`useDisposableLayer` and the old positional `useSource` signature still work but will not gain features.
