# Sources & layers

## Two flavours of the same thing

`MglSource` and `MglLayer` are **generic** components. `options` is narrowed by `type`, all the way into
your template:

```vue
<MglSource source-id="places" type="geojson" :options="{ data }" />
<MglLayer layer-id="fill" type="fill" :options="{ paint: { 'fill-color': '#f00' } }" />
```

Put a `tiles` array on a `geojson` source and it is a type error where you wrote it, not at runtime.

The named components are thin wrappers over exactly those two:

```vue
<MglGeoJsonSource source-id="places" :options="{ data }" />
<MglFillLayer layer-id="fill" :paint="{ 'fill-color': '#f00' }" />
```

They keep their original flat props, so templates written against v5 still compile. Which to use is a
matter of taste — the generic form is one import for every layer kind and reads closer to the maplibre
style specification; the named form is shorter and discoverable through autocomplete.

::: info Why `sourceLayer` and not `source-layer`
Props follow maplibre's option names, but a hyphen is not a valid identifier. `sourceLayer` is mapped to
`source-layer` when the layer object is built. The same applies to `mapStyle` → `style` on `MglMap`.
:::

## Nesting binds them together

A layer inside a source needs no `source` prop:

```vue
<MglGeoJsonSource source-id="places" :options="{ data }">
	<MglCircleLayer layer-id="dots" :paint="{ 'circle-radius': 5 }" />
</MglGeoJsonSource>
```

The source provides its id, and the layer waits for it. That waiting is a three-state affair, and the
distinction matters if you ever build your own layer component:

| Handle value | Meaning                                                      | Layer behaviour |
| ------------ | ------------------------------------------------------------ | --------------- |
| `Source`     | on the map and ready                                         | adds itself     |
| `null`       | not added yet, or torn down by a style switch                | **waits**       |
| `undefined`  | nothing is being tracked (e.g. a `Source` object was passed) | adds itself     |

`null` and `undefined` are not interchangeable here. A layer that treated them the same would either add
itself against a source that no longer exists, or wait forever for one that was never tracked.

## Changes apply to the live map

Sources and layers are **not** add-only. Options are diffed against what was last applied:

**Layers**

| Change                       | What happens                              |
| ---------------------------- | ----------------------------------------- |
| a `paint` property           | `setPaintProperty` for that one property  |
| a `layout` property          | `setLayoutProperty` for that one property |
| `filter`                     | `setFilter`                               |
| `minzoom` / `maxzoom`        | `setLayerZoomRange`                       |
| `source-layer` or `metadata` | no setter exists → the layer is recreated |

Paint and layout are diffed **per property** on purpose. maplibre offers no bulk setter, and re-setting
every property would restart running transitions.

**Sources**

Each source kind has its own set of keys with an in-place setter — `data` and the `cluster*` options on
geojson, `tiles`/`url` on vector and raster, `coordinates` on image, video and canvas. Anything else
means remove and re-add, and the nested layers follow along in the right order.

::: warning maplibre v6 made two setters async
`setData()` and `setClusterOptions()` return `Promise<void>` in v6 (they returned `this` in v5). A
rejection is routed to the map's `error` event rather than dropped, so `@map:error` is where a failed
data update surfaces.
:::

## Teardown order

maplibre throws if you remove a source while a layer still references it. Layers therefore register an
unmount handler with their enclosing source, and the source removes them before removing itself.

This is not a detail you have to think about when nesting components — but it is why
[`useMglMap`](/guide/composables) disposes in `onUnmounted` rather than `onBeforeUnmount`, and it is
enforced by the test suite: the test double throws on a wrong-order removal, so a regression fails the
build instead of producing a console warning.

## Layer events

Layer events are unprefixed and only fire for features of that layer:

```vue
<MglFillLayer layer-id="fill" @click="onClick" @mouseenter="hover = true" @mouseleave="hover = false" />
```

Available: `click`, `dblclick`, `mousedown`, `mouseup`, `mousemove`, `mouseenter`, `mouseleave`,
`mouseover`, `mouseout`, `contextmenu`, `touchstart`, `touchend`, `touchcancel`.

They are bound with maplibre's `(event, layerId, handler)` signature, which Vue's emit system cannot
express — so the named wrappers deliberately declare no `emits` and forward listeners through `$attrs`
onto `MglLayer` instead. The practical consequence: they work exactly as you would expect, but they do
not appear in `MglFillLayer`'s own emits declaration. The [API reference](/api/layers) lists them anyway.

## Layer order

`before` inserts a layer beneath an existing one:

```vue
<MglFillLayer layer-id="water" before="labels" />
```

Without it, layers are appended in mount order.
