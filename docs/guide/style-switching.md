# Style switching

Swapping the style throws away every source and layer maplibre holds. Getting them back is the trickiest
part of this library, and it is handled for you — but the sequence is worth knowing, because there are two
different paths through it.

## With `MglStyleSwitchControl`

```vue
<MglMap map-style="https://demotiles.maplibre.org/style.json">
	<MglStyleSwitchControl :styles="styles" @style-switched="onSwitched" />
</MglMap>
```

```ts
const styles = [
  { name: 'streets', label: 'Streets', style: 'https://demotiles.maplibre.org/style.json' },
  { name: 'dark', label: 'Dark', style: darkStyleSpec }
];
```

What happens, in order:

1. The control emits `styleSwitched` on the map's internal event emitter.
2. `MglMap` resets every source handle in its registry to `null`.
3. Layers see `null`, drop their handles and stop touching the old objects.
4. maplibre fires `style.load`.
5. Sources re-add themselves and write the new `Source` into their handle.
6. Layers see a `Source` again and re-add themselves.

`setStyle` runs with `{ diff: false }` on purpose. With diffing enabled, maplibre does not reliably fire
`style.load` ([maplibre-gl-js#2587](https://github.com/maplibre/maplibre-gl-js/issues/2587)), and the
whole sequence hinges on that event.

<DemoStyleSwitch />

## With a plain `setStyle` or a changed `mapStyle` prop

```vue
<MglMap :map-style="currentStyle" />
```

This path does **not** broadcast `styleSwitched` — only the control does. The source handle therefore goes
straight from the old `Source` to the new one, so watching the handle is not enough to notice.

That is why layers subscribe to `style.load` themselves and clear their `isAdded` flag first. Without it, a
layer would consider itself still added, skip the re-add, and be gone for good the moment you changed the
style prop. If you write your own layer component on top of `useLayer()`, you get this for free; if you
drive `map.addLayer()` by hand, this is the case to remember.

## Style-level settings

Terrain, sky, light, projection, global state and images are style-level settings, not layers: a style
switch wipes them too, and they can only be applied once the style has loaded. The
[declarative components](/guide/style-settings) re-apply themselves on every `style.load`, which is the
usual reason hand-rolled terrain wrappers stop working after the first switch.

## What is tested

The suite switches styles repeatedly and asserts that no layer id leaks and that no source is ever removed
while a layer still references it. The test double throws on the latter rather than merely recording it, so
a regression in the ordering fails the build.
