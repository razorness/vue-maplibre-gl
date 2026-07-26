# API reference

Every table on these pages is **generated** from the components' own types and doc comments by
`scripts/gen-meta.mjs`, using `vue-component-meta`. The same metadata produces `web-types.json`, which is
what makes JetBrains IDEs complete these props. Nothing here is maintained by hand, so a table cannot drift
from the code.

| Page                                | Components                                           |
| ----------------------------------- | ---------------------------------------------------- |
| [Map](/api/map)                     | `MglMap`                                             |
| [Sources](/api/sources)             | `MglSource` and the seven named sources              |
| [Layers](/api/layers)               | `MglLayer` and the ten named layers                  |
| [Controls](/api/controls)           | eleven controls, including `MglCustomControl`        |
| [Style settings](/api/style)        | terrain, sky, light, projection, image, global state |
| [Marker & popup](/api/marker-popup) | `MglMarker`, `MglPopup`, `MglButton`                 |
| [Composables](/api/composables)     | the composable API                                   |
| [Draw plugin](/draw/)               | `MglDrawControl` and `DrawPlugin`                    |

::: info Why the event tables have no descriptions
Props and slots carry their doc comments into these tables. Events do not, and cannot: emits are declared
as a _type_ (`defineEmits<MglLayerEmits>()`), and `vue-component-meta` reports the payload type but drops
the JSDoc for type-declared emits — whether the type is inline or imported. The comments exist in the
source and show up on hover in an editor; what they say is in the guides. Payload types below are real,
generated ones.
:::

## Conventions across all components

**Props are named after maplibre's options.** Two exceptions, both forced: `mapStyle` stands in for
`style` (taken by the HTML attribute) and `sourceLayer` for `source-layer` (not a valid identifier).

**Map events are prefixed `map:`**, layer events are not. Map event payloads are `MglEvent`
(`{ type, map, component, event }`); layer event payloads are maplibre's own.

**Required props carry a badge** in the tables below. Everything else is optional, and a prop left
undefined is not passed to maplibre at all — maplibre's own default applies.

**Defaults shown as `defaults.x`** come from `MglDefaults`, a reactive options object you can mutate before
mounting to set library-wide defaults:

```ts
import { MglDefaults } from 'vue-maplibre-gl';

MglDefaults.style = 'https://demotiles.maplibre.org/style.json';
MglDefaults.zoom = 4;
```
