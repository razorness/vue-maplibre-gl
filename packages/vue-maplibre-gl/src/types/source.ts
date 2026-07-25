import type { CanvasSourceSpecification, SourceSpecification } from 'maplibre-gl';

/**
 * Every source `type` this library can add to a map.
 *
 * `CanvasSourceSpecification` is declared by maplibre-gl itself rather than by the style spec and is
 * **not** part of the `SourceSpecification` union, so anything keyed off `SourceSpecification['type']`
 * alone silently loses `'canvas'`. It is unioned in explicitly here — always use these aliases
 * instead of reaching for `SourceSpecification` directly.
 */
export type MglAnySourceSpecification = SourceSpecification | CanvasSourceSpecification;

/** Discriminator values: `'vector' | 'raster' | 'raster-dem' | 'geojson' | 'video' | 'image' | 'canvas'`. */
export type MglSourceKind = MglAnySourceSpecification['type'];

/** The full maplibre specification for one source kind, e.g. `MglSourceSpec<'geojson'>`. */
export type MglSourceSpec<T extends MglSourceKind> = Extract<MglAnySourceSpecification, { type: T }>;

/**
 * The options of one source kind, i.e. its specification without the `type` discriminator — the
 * shape the generic `<MglSource type="…" :options="…"/>` component takes.
 */
export type MglSourceOptions<T extends MglSourceKind> = Omit<MglSourceSpec<T>, 'type'>;
