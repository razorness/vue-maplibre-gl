# Theming with CSS

The stylesheet is plain CSS — no preprocessor, no build step on your side. Two rules govern it:

1. **Everything lives in a named cascade layer** (`vue-maplibre-gl`, and `vue-maplibre-gl-draw` for the
   draw plugin), so you can order it against your own styles deliberately.
2. **Every value worth changing is a `--mgl-*` custom property scoped to `.mgl-container`** — not to
   `:root`. Two maps on one page can therefore be themed differently, and the library never writes into
   your global scope.

## Overriding tokens

```css
.mgl-container {
  --mgl-control-bg: #1b1b1f;
  --mgl-control-fg: #e6e6e6;
  --mgl-control-radius: 10px;
}
```

Scope it further to theme one map only:

```css
.map-dark .mgl-container {
  --mgl-control-bg: #000;
}
```

The full token list is documented at the bottom of `src/css/index.css` in the repository.

## Dark mode

Dark mode is a `@media (prefers-color-scheme: dark)` block plus a `data-mgl-theme` attribute that
overrides in both directions:

```html
<div data-mgl-theme="dark">…</div>
<!-- force dark, regardless of the OS setting -->
<div data-mgl-theme="light">…</div>
<!-- force light -->
```

::: details Why not `light-dark()`
`light-dark()` would be the obvious modern answer, and it was tried. lightningcss downlevels it into
`--lightningcss-light` / `--lightningcss-dark` helper variables that would land in every consumer's
`.mgl-container` scope, and it offers no way to _force_ a theme — which is exactly what an application
with its own theme switch needs. The attribute hook does both.

`color-scheme` is deliberately not set either: it changes how the browser paints UA widgets and scrollbars
inside the container, which is the application's decision, not the library's. It was only ever needed to
make `light-dark()` resolve.
:::

## Tailwind v4

Nothing collides: every class name is `mgl-` or maplibre's own `maplibregl-`, so no utility can be
shadowed. Layer order is the only thing to be explicit about:

```css
@layer theme, base, components, vue-maplibre-gl, utilities;

@import 'tailwindcss';
@import 'vue-maplibre-gl/style.css';
```

With `vue-maplibre-gl` before `utilities`, your Tailwind utilities win over the library's control styles —
so `class="rounded-none"` on a control does what it says.

To drive the tokens from your Tailwind theme:

```css
@theme {
  --color-map-chrome: oklch(0.28 0.02 260);
}

.mgl-container {
  --mgl-control-bg: var(--color-map-chrome);
  --mgl-control-shadow: 0 1px 2px --alpha(var(--color-map-chrome) / 40%);
}
```
