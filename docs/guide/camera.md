# Camera binding

Six camera properties are two-way bindable:

```vue
<MglMap v-model:center="center" v-model:zoom="zoom" v-model:bearing="bearing" v-model:pitch="pitch" />
```

`center`, `zoom`, `bearing`, `pitch`, `roll` and `bounds`. Set one and the map moves; move the map and the
binding updates.

## Only what you bind is bound

Nothing is wired for a property you did not `v-model`. If you only bind `zoom`, no `moveend` handler is
attached for `center`, and panning emits nothing.

## The loop guard works by origin, not by value

The obvious way to prevent a feedback loop is to compare the value coming back against the prop and skip
the emit if they match. That does not work here: maplibre clamps and rounds what it is given. With
`zoomSnap` at its default, a `zoom` of `4.3` comes back as `4`; with `maxBounds` set, a `center` outside
them comes back moved. The value legitimately differs from the one you set, so a value comparison would
either emit a correction you did not ask for or swallow a real user movement.

Instead, every prop-driven camera change marks itself as programmatic, and the next settle event consumes
that flag instead of emitting. The origin of the change decides, not the numbers.

## Settle events only

Bindings listen on `moveend`, `zoomend`, `rotateend`, `pitchend` and `rollend` — never on the continuous
`move`/`zoom` events. A `v-model` that fired on every animation frame would re-render your component sixty
times a second while the user drags.

If you _want_ the continuous stream, subscribe to it explicitly:

```ts
useMapEvent('move', event => (liveCenter.value = event.target.getCenter()));
```

## `bounds`

`bounds` is the odd one out: reading it gives you the current viewport, writing it fits the map to the
box. `fitBoundsOptions` on `MglMap` controls the padding and animation used for the write, and setting
`useOnBoundsUpdate` on it makes a `bounds` update reuse those options.
