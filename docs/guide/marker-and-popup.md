# Marker & popup

## Marker with custom content

```vue
<MglMarker :coordinates="[7.1, 50.7]">
	<div class="pin">📍</div>
</MglMarker>
```

Without a slot you get maplibre's default marker. With one, your markup replaces it entirely.

::: tip Marker and popup take flat props
Unlike `MglSource` and `MglLayer`, these two have no `options` prop — every maplibre marker and popup
option is its own prop (`draggable`, `color`, `offset`, `anchor`, `closeButton`, …). See the
[API reference](/api/marker-popup).
:::

The slot content is rendered into a **detached** element that is handed to maplibre as the marker's
`element`. maplibre then owns that node — it positions it, applies transforms and removes it. That is why
the content is teleported rather than rendered as a normal child, and why you cannot reach it through the
component's own DOM subtree.

<DemoMarkerPopup />

## Dragging

```vue
<MglMarker v-model:coordinates="coords" draggable @dragend="onDragEnd" />
```

`v-model:coordinates` follows the drag. Events: `click`, `dragstart`, `drag`, `dragend`.

## Popup

Standalone, positioned by its own coordinates:

```vue
<MglPopup :coordinates="[7.1, 50.7]">
	<h3>Bonn</h3>
</MglPopup>
```

Or attached to a marker, by nesting it:

```vue
<MglMarker :coordinates="[7.1, 50.7]">
	<template #popup>
		<h3>Bonn</h3>
	</template>
</MglMarker>
```

Nested, the popup registers itself through `marker.setPopup()` and deliberately does **not** add itself to
the map — maplibre toggles it from the marker, and a popup that also added itself would appear twice and
never close. Standalone, it adds itself. The component detects which case it is in through injection, so
there is no prop to set.

`v-model:open` controls visibility in both cases.

## Both are also composables

```ts
const { marker, element } = useMarker({ coordinates: () => coords.value, options: { draggable: true } });
const { popup } = usePopup({ coordinates: () => coords.value });
```

Same mechanism, no component required — see [composables](/guide/composables).
