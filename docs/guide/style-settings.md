# Terrain, sky & globe

Six settings live on the style rather than on a layer. All six are declarative components, and all six
survive a style switch:

```vue
<MglMap map-style="…">
	<MglRasterDemSource source-id="terrain-dem" :options="{ url: demUrl, tileSize: 256 }" />
	<MglTerrain source="terrain-dem" :exaggeration="1.4" />
	<MglSky :options="{ 'sky-color': '#8ec5fc' }" />
	<MglLight :options="{ anchor: 'viewport', intensity: 0.4 }" />
	<MglProjection type="globe" />
	<MglImage id="pin" :url="pinUrl" />
	<MglGlobalState :state="{ highlight: 'red' }" />
</MglMap>
```

| Component        | maplibre call              |
| ---------------- | -------------------------- |
| `MglTerrain`     | `setTerrain`               |
| `MglSky`         | `setSky`                   |
| `MglLight`       | `setLight`                 |
| `MglProjection`  | `setProjection`            |
| `MglImage`       | `addImage` / `updateImage` |
| `MglGlobalState` | `setGlobalStateProperty`   |

<DemoGlobe />

## Why these need a component at all

Each of those calls shares an awkward lifecycle: it only works once the style has loaded, **and** every
style switch wipes it. Both halves have to be handled, and the second one is what usually breaks
hand-written wrappers — terrain appears, you switch the basemap, and it is silently gone.

All six sit on a shared `useStyleSetting()` composable that applies the setting when the style is ready and
re-applies it on every `style.load`. If you add a style-level setting of your own, build it on that rather
than by hand.

## `MglTerrain` vs `MglTerrainControl`

Two different things, deliberately not merged:

- **`MglTerrain`** is the setting. Terrain is on for as long as the component is mounted.
- **`MglTerrainControl`** is maplibre's button that lets the _user_ toggle terrain.

Use the first for a map that is always 3D, the second to offer a choice, or both if you want terrain on by
default with a button to turn it off.

## Globe

`<MglProjection type="globe" />` is the declarative form. `MglGlobeControl` gives the user a button
instead. `projection` is also a prop on `MglMap` — it is not a `MapOptions` key but a style-level setting,
which is why it is applied through `setProjection` once the style is ready rather than passed to the
constructor.
