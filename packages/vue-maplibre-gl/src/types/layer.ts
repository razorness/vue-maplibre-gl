import type { LayerSpecification } from 'maplibre-gl';

/**
 * Every layer `type` maplibre-gl supports:
 * `'fill' | 'line' | 'symbol' | 'circle' | 'heatmap' | 'fill-extrusion' | 'raster' | 'hillshade' | 'color-relief' | 'background'`.
 *
 * Derived from the spec union, so a new layer type in a future maplibre release shows up here
 * automatically instead of having to be discovered by hand.
 */
export type MglLayerKind = LayerSpecification['type'];

/** The full maplibre specification for one layer kind, e.g. `MglLayerSpec<'fill'>`. */
export type MglLayerSpec<T extends MglLayerKind> = Extract<LayerSpecification, { type: T }>;

/**
 * The options of one layer kind: its specification without the parts the component owns
 * (`id` comes from `layerId`, `type` from `type`, `source` from the prop or the enclosing source).
 *
 * Leaves `layout`, `paint`, `filter`, `minzoom`, `maxzoom`, `metadata` and — where the layer kind has
 * one — `source-layer`, all narrowed to the given kind.
 */
export type MglLayerOptions<T extends MglLayerKind> = Omit<MglLayerSpec<T>, 'id' | 'type' | 'source'>;

/** `paint` of one layer kind, e.g. `MglLayerPaint<'circle'>`. */
export type MglLayerPaint<T extends MglLayerKind> = MglLayerSpec<T>['paint'];

/** `layout` of one layer kind, e.g. `MglLayerLayout<'symbol'>`. */
export type MglLayerLayout<T extends MglLayerKind> = MglLayerSpec<T>['layout'];

/**
 * `filter` of one layer kind. Not every layer kind has one — `background` and `color-relief` do not —
 * so this resolves to `never` for those, which is what makes passing a filter to them a type error.
 */
export type MglLayerFilter<T extends MglLayerKind> = MglLayerSpec<T> extends { filter?: infer F } ? F : never;
