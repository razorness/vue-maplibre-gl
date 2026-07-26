# Draw plugin

The draw plugin is reachable **only** through its own entry point:

```ts
import { DrawMode, DrawPlugin, MglDrawControl } from 'vue-maplibre-gl/draw';
import 'vue-maplibre-gl/draw.css';
```

That separation is deliberate. `src/index.ts` does not re-export it — in v5 it did, which meant the draw
code and its seven `@turf/*` dependencies landed in every bundle whether or not you drew anything.

::: warning Breaking change from v5
If you imported the draw plugin from the package root, change the import to `vue-maplibre-gl/draw`.
:::

## As a component

```vue
<MglMap map-style="…">
	<MglDrawControl v-model="feature" :min-area="500" @update="onUpdate" />
</MglMap>
```

<ApiTable name="MglDrawControl" />

## As a plain class

`DrawPlugin` drives maplibre directly and knows nothing about Vue — `MglDrawControl` is a thin wrapper
around it and doubles as the reference example for using it standalone:

```ts
import { DrawMode, DrawPlugin } from 'vue-maplibre-gl/draw';

const draw = new DrawPlugin(map, { onUpdate: feature => console.log(feature) });
draw.setMode(DrawMode.POLYGON);
```

## Modes

| Mode            | What it does                                                                    |
| --------------- | ------------------------------------------------------------------------------- |
| `POLYGON`       | click to add vertices, drag to move them, ctrl+click a vertex to delete it      |
| `CIRCLE`        | drag from the centre outwards                                                   |
| `CIRCLE_STATIC` | a fixed circle pinned to the viewport, converted to geometry on viewport change |

`CIRCLE_STATIC` is different in kind from the other two: it builds **DOM elements** rather than geometry
while it is being manipulated, so it is styled with CSS, not paint properties.

## The model

Always a closed `Feature<Polygon, DrawFeatureProperties>`. Properties carry `center`, `radius`, `area`,
`tooSmall` and `meta`, which the default styles filter on.

The plugin keeps one geojson source (`mgl-draw-plugin`) whose feature collection follows a positional
convention: `features[0]` is the polygon, `[1]` the vertices, `[2]` the midpoints.

## Styling

The layers are generated from `DefaultDrawStyles`, and the whole array can be replaced. `minArea` renders a
hatch pattern to a canvas and registers it as a maplibre image.

Pointer hit-testing uses a pixel radius (`pointerPrecision`, 24px for mouse and 36px for touch) rather than
maplibre feature queries, so grabbing a vertex works at the size a finger actually is.

## Status

This plugin is the least modernised part of the package: it was moved to its own entry, wrapped in an SFC and
made SSR-safe, but its internals are still the v5 implementation. Expect its API to gain types rather than
change shape.
