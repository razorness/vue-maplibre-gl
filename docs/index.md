---
layout: home

hero:
  name: vue-maplibre-gl
  text: maplibre-gl v6 for Vue 3
  tagline: Declarative components and composables. Typed against maplibre's own option types, tree-shakeable, SSR-safe.
  actions:
    - theme: brand
      text: Get started
      link: /guide/getting-started
    - theme: alt
      text: API reference
      link: /api/
    - theme: alt
      text: GitHub
      link: https://github.com/razorness/vue-maplibre-gl

features:
  - title: Props are maplibre's options
    details: Every prop is named after the maplibre option it sets, and the key lists are proven complete at compile time. When maplibre adds an option, the build fails until it has a prop — it cannot silently go missing.
    link: /api/map
    linkText: Map API
  - title: One generic component per concept
    details: '<MglSource type="geojson" :options="…"> narrows options to the geojson specification, in your template. The named components (MglGeoJsonSource, MglFillLayer, …) remain as thin wrappers.'
    link: /guide/sources-and-layers
    linkText: Sources & layers
  - title: Components or composables
    details: Everything below the map is available both ways. useMglMap() gives you the whole lifecycle against your own container element, and useSource()/useLayer() work against a raw maplibre map too.
    link: /guide/composables
    linkText: Composables
  - title: Reactive, not add-only
    details: Changing paint, layout, filter, zoom range or source data applies to the live map — per property, so transitions are not restarted. What has no maplibre setter recreates the object in the right order.
    link: /guide/sources-and-layers
    linkText: How diffing works
  - title: Survives style switching
    details: Sources and layers re-add themselves after setStyle, in the order maplibre requires, for an arbitrary number of switches. The test suite fails if a source is ever removed while a layer still references it.
    link: /guide/style-switching
    linkText: Style switching
  - title: Themeable with plain CSS
    details: One cascade layer, every value a --mgl-* custom property scoped to the map container — so two maps on a page can look different and nothing leaks into your global scope. Tailwind v4 compatible.
    link: /guide/theming
    linkText: Theming
---
