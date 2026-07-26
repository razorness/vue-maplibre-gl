# Map

<ApiTable name="MglMap" />

## Notes

`mapStyle` is maplibre's `style` option. The rename exists because `style` is the HTML style attribute; it
is mapped back when the map is constructed.

The 61 `map:*` events mirror maplibre's `MapEventType` one-to-one, and that list is proven complete at
compile time — when maplibre adds an event, the build fails until it is declared. Payloads are typed `any[]`
in the table because the emits are declared as a runtime array; the actual payload is always an `MglEvent`.

`projection` is not a `MapOptions` key. It is a style-level setting applied through `setProjection` once the
style is ready, which is why it is also available as [`MglProjection`](/api/style).

### WebGL context loss

`MglMap` listens for `webglcontextlost` on the canvas and performs a full `dispose()` followed by a fresh
`initialize()`. Anything you attach to the map yourself has to be re-attached — subscribe to `@map:load`
rather than doing it once after mount, and it survives the restart.
