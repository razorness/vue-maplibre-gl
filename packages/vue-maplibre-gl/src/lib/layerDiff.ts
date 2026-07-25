import type { Map } from 'maplibre-gl';
import type { MglLayerKind, MglLayerOptions } from 'types/layer';

/**
 * Options a layer can change in place, and how.
 *
 * Everything else (`source`, `source-layer`, the layer `type`) is baked into the layer at creation and
 * needs a remove + re-add, which is why {@link needsRecreate} exists.
 */
const IN_PLACE_KEYS = ['paint', 'layout', 'filter', 'minzoom', 'maxzoom'] as const;

/** Keys that cannot be changed on a live layer. */
const RECREATE_KEYS = ['source-layer', 'metadata'] as const;

type AnyLayerOptions = Partial<Record<(typeof IN_PLACE_KEYS)[number] | (typeof RECREATE_KEYS)[number], unknown>>;

/**
 * maplibre types `setPaintProperty`/`setLayoutProperty` against flat unions of every known property
 * name. The names here come from `Object.keys()` of a `paint`/`layout` object that is *already*
 * narrowed to the layer kind, so they are valid by construction — but a `string` can never satisfy
 * those unions. Widening the two setters in one place beats sprinkling `as never` at each call, which
 * would also swallow the value type.
 */
interface LoosePropertySetters {
	setPaintProperty(layerId: string, name: string, value: unknown): unknown;
	setLayoutProperty(layerId: string, name: string, value: unknown): unknown;
}

const loose = (map: Map): LoosePropertySetters => map;

function shallowEqual(a: unknown, b: unknown): boolean {
	if (a === b) {
		return true;
	}
	if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
		return false;
	}
	const ak = Object.keys(a),
		bk = Object.keys(b);
	return ak.length === bk.length && ak.every(k => (a as any)[k] === (b as any)[k]);
}

/**
 * True when the change cannot be applied to the live layer and the layer has to be recreated.
 *
 * `metadata` is included because maplibre offers no setter for it.
 */
export function needsRecreate(previous: AnyLayerOptions | undefined, next: AnyLayerOptions | undefined): boolean {
	if (!previous || !next) {
		return false;
	}
	return RECREATE_KEYS.some(key => !shallowEqual(previous[key], next[key]));
}

/**
 * Applies the difference between two option objects to a layer that is already on the map, using the
 * narrowest maplibre setter for each change.
 *
 * `paint` and `layout` are diffed per property rather than wholesale: `setPaintProperty` is the only
 * granularity maplibre offers, and re-setting every property on each change would restart transitions
 * and cost a full repaint.
 *
 * Returns `false` when the change requires a recreate instead — the caller is expected to do that.
 */
export function applyLayerDiff<T extends MglLayerKind>(
	map: Map,
	layerId: string,
	previous: MglLayerOptions<T> | undefined,
	next: MglLayerOptions<T> | undefined
): boolean {
	const prev = (previous ?? {}) as AnyLayerOptions,
		curr = (next ?? {}) as AnyLayerOptions;

	if (needsRecreate(prev, curr)) {
		return false;
	}

	// paint / layout: per-property
	for (const group of ['paint', 'layout'] as const) {
		const before = (prev[group] ?? {}) as Record<string, unknown>,
			after = (curr[group] ?? {}) as Record<string, unknown>,
			names = new Set([...Object.keys(before), ...Object.keys(after)]);

		for (const name of names) {
			if (before[name] === after[name]) {
				continue;
			}
			if (group === 'paint') {
				loose(map).setPaintProperty(layerId, name, after[name]);
			} else {
				loose(map).setLayoutProperty(layerId, name, after[name]);
			}
		}
	}

	if (prev.filter !== curr.filter) {
		map.setFilter(layerId, curr.filter as never);
	}

	/*
	 * setLayerZoomRange takes both bounds at once, so it has to be called when either changes.
	 * maplibre's own defaults (0 / 24) stand in for "unset".
	 */
	if (prev.minzoom !== curr.minzoom || prev.maxzoom !== curr.maxzoom) {
		map.setLayerZoomRange(layerId, (curr.minzoom as number | undefined) ?? 0, (curr.maxzoom as number | undefined) ?? 24);
	}

	return true;
}
