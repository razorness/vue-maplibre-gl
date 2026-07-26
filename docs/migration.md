# Migrating from v5

Most templates compile unchanged. The named components kept their prop names on purpose, so the majority of
this migration is a toolchain update rather than a code change.

## Requirements

|               | v5        | v6                      |
| ------------- | --------- | ----------------------- |
| maplibre-gl   | 4.x / 5.x | **6.x**                 |
| Vue           | 3.2+      | **3.5+**                |
| Node          | 16+       | **^20.19 \|\| >=22.12** |
| Module format | ESM + CJS | **ESM only**            |

## Breaking changes

### 1. No CommonJS build

`require('vue-maplibre-gl')` no longer works, because maplibre-gl v6 itself publishes no `require`
condition — a CJS build could not load its own peer dependency. If you are on a CJS-only bundler, this
release is not available to you.

### 2. The draw plugin moved behind a subpath

```diff
- import { MglDrawControl } from 'vue-maplibre-gl';
+ import { MglDrawControl } from 'vue-maplibre-gl/draw';
+ import 'vue-maplibre-gl/draw.css';
```

This is what keeps `@turf/*` out of the main bundle.

### 3. `@types/geojson` is now an optional peer dependency

If your GeoJSON types went from checked to `any`, install it and add the reference — see
[Installation](/guide/installation#geojson). This is worth doing deliberately rather than ignoring: without
it, the degradation is silent.

### 4. Stylesheet is one file

The Sass partials are gone. `vue-maplibre-gl/style.css` is plain CSS in a cascade layer with `--mgl-*`
tokens. If you imported `src/css/*.scss` directly or overrode the compiled selectors, see
[theming](/guide/theming) — the token override is now the supported path.

### 5. Component types changed shape

Every component is an SFC now. Template usage is unaffected; if you imported a component _type_
(`InstanceType<typeof MglMap>`), the signature differs.

### 6. `interactive` on layers is ignored

It was never a maplibre layer specification key and used to be forwarded into `addLayer` as an unknown
property. It is `@deprecated` and does nothing. The `ref` prop in the old key list was equally bogus and is
gone.

## Things that were broken and now work

- **Changing `paint`, `layout`, `filter`, `minzoom` or `maxzoom` at runtime.** Layers were add-only in v5;
  updates silently did nothing. They now apply per property.
- **Layer events on `MglBackgroundLayer`.** The component never passed its instance through, so no event
  ever fired.
- **`MglDrawControl`'s `styles`.** The README documented `:style="…"`, which landed on the DOM style
  attribute. It is a real prop now.
- **Two memory leaks.** The module-global source-ref map and the map registry were never pruned; both are
  per-map and collected with the map.

## maplibre v6 changes that reach you

- `experimentalZoomLevelsToOverscale` is now `zoomLevelsToOverscale`, and `terrainSkirtLength` is new — both
  are props.
- `map.on()` returns a `Subscription` with `unsubscribe()`. Only relevant if you subscribe on the raw map;
  the composables handle it.
- `GeoJSONSource.setData()` and `setClusterOptions()` return `Promise<void>` instead of `this`. A rejection
  now surfaces on `@map:error`.
- `MapDataEvent` and `MapLibreZoomEvent` were removed in favour of `MapSourceDataEvent`,
  `MapStyleDataEvent` and `MapBoxZoomEvent`.
- New in v6 and exposed here: `MglGlobeControl`, `MglTerrainControl`, `MglLogoControl`, `MglGlobalState`
  (`setGlobalStateProperty`), and `MglColorReliefLayer`.
