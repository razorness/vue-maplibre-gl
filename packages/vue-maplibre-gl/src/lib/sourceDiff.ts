import type { CanvasSource, GeoJSONSource, ImageSource, RasterTileSource, Source, VectorTileSource, VideoSource } from 'maplibre-gl';
import type { MglSourceKind, MglSourceOptions } from 'types/source';

type AnyOptions = Record<string, unknown>;

/** Cluster options maplibre can change on a live geojson source via `setClusterOptions`. */
const CLUSTER_KEYS = ['cluster', 'clusterRadius', 'clusterMaxZoom', 'clusterMinPoints', 'clusterProperties'] as const;

/**
 * Per source kind: which option keys have an in-place setter. A change to any key *not* listed here
 * means the source has to be removed and re-added — and with it every layer that references it.
 */
const IN_PLACE_KEYS: Record<MglSourceKind, readonly string[]> = {
	geojson: ['data', ...CLUSTER_KEYS],
	vector: ['tiles', 'url'],
	raster: ['tiles', 'url'],
	'raster-dem': ['tiles', 'url'],
	image: ['url', 'coordinates'],
	video: ['coordinates'],
	canvas: ['coordinates']
};

function changedKeys(previous: AnyOptions, next: AnyOptions): string[] {
	const names = new Set([...Object.keys(previous), ...Object.keys(next)]);
	return [...names].filter(name => previous[name] !== next[name]);
}

/**
 * True when every changed key has an in-place setter for this source kind.
 *
 * Note this is a *reference* comparison per key. A caller that rebuilds its options object on every
 * render will therefore look "changed" — which is correct for `data` (the point of the watcher) and
 * harmless for the rest, since applying an unchanged value through a setter is a no-op in maplibre.
 */
export function canApplyInPlace<T extends MglSourceKind>(
	kind: T,
	previous: MglSourceOptions<T> | undefined,
	next: MglSourceOptions<T> | undefined
): boolean {
	if (!previous || !next) {
		return false;
	}
	const allowed = IN_PLACE_KEYS[kind] ?? [];
	return changedKeys(previous as AnyOptions, next as AnyOptions).every(key => allowed.includes(key));
}

/**
 * Applies an option change to a live source using the narrowest setter maplibre offers.
 *
 * Returns `false` when the change cannot be applied in place; the caller must then recreate the source
 * (and re-add its layers).
 *
 * maplibre v6 made `setData` and `setClusterOptions` async. Their promises are returned to the caller
 * through {@link SourceDiffResult.pending} rather than dropped, so a source update can actually be
 * awaited and its failure reported.
 */
export function applySourceDiff<T extends MglSourceKind>(
	kind: T,
	source: Source,
	previous: MglSourceOptions<T> | undefined,
	next: MglSourceOptions<T> | undefined
): SourceDiffResult {
	if (!canApplyInPlace(kind, previous, next)) {
		return { applied: false, pending: [] };
	}

	const prev = previous as AnyOptions,
		curr = next as AnyOptions,
		changed = new Set(changedKeys(prev, curr)),
		pending: Array<Promise<void>> = [];

	switch (kind) {
		case 'geojson': {
			const geojson = source as GeoJSONSource;
			if (changed.has('data')) {
				pending.push(geojson.setData((curr.data ?? { type: 'FeatureCollection', features: [] }) as never));
			}
			if (CLUSTER_KEYS.some(key => changed.has(key))) {
				pending.push(
					geojson.setClusterOptions({
						cluster: curr.cluster as boolean | undefined,
						clusterRadius: curr.clusterRadius as number | undefined,
						clusterMaxZoom: curr.clusterMaxZoom as number | undefined
					})
				);
			}
			break;
		}

		case 'vector':
		case 'raster':
		case 'raster-dem': {
			const tiled = source as VectorTileSource | RasterTileSource;
			if (changed.has('url') && typeof curr.url === 'string') {
				tiled.setUrl(curr.url);
			}
			if (changed.has('tiles') && Array.isArray(curr.tiles)) {
				tiled.setTiles(curr.tiles as string[]);
			}
			break;
		}

		case 'image': {
			const image = source as ImageSource;
			/*
			 * updateImage covers both at once and is the only way to change the url, so a url change
			 * must not additionally go through setCoordinates.
			 */
			if (changed.has('url')) {
				image.updateImage({ url: curr.url as string, coordinates: curr.coordinates as never });
			} else if (changed.has('coordinates')) {
				image.setCoordinates(curr.coordinates as never);
			}
			break;
		}

		case 'video':
		case 'canvas': {
			if (changed.has('coordinates')) {
				(source as VideoSource | CanvasSource).setCoordinates(curr.coordinates as never);
			}
			break;
		}

		/* v8 ignore next 2 -- unreachable: `kind` is exhaustive over MglSourceKind */
		default:
			return { applied: false, pending: [] };
	}

	return { applied: true, pending };
}

export interface SourceDiffResult {
	/** `false` means the caller has to recreate the source. */
	applied: boolean;
	/** Promises from the async v6 setters (`setData`, `setClusterOptions`). */
	pending: Array<Promise<void>>;
}
