import type { Map as MaplibreMap } from 'maplibre-gl';
import mitt, { type Emitter } from 'mitt';
import { inject, isRef, ref, shallowRef, type Ref, type ShallowRef } from 'vue';
import { ControlRegistry } from 'lib/controlRegistry';
import { MglSourceRegistry } from 'lib/sourceRegistry';
import { controlRegistrySymbol, emitterSymbol, isLoadedSymbol, mapSymbol, sourceRegistrySymbol, type MglEvents } from 'types';

/**
 * Everything a source/layer/marker composable needs from its map.
 *
 * `<MglMap>` (really `useMglMap`) provides all of it through inject; when a composable is handed a raw
 * maplibre map instead, the missing pieces are synthesised — see {@link useMapContext}.
 */
export interface MglMapContext {
	map: ShallowRef<MaplibreMap | undefined>;
	/** `true` once maplibre has fired `load`. Sources and layers gate everything on this. */
	isLoaded: Ref<boolean>;
	/** Carries `styleSwitched`, which tells sources to drop their handles before a style swap. */
	emitter: Emitter<MglEvents>;
	sourceRegistry: MglSourceRegistry;
	controlRegistry: ControlRegistry;
}

/**
 * A map passed explicitly to a composable, instead of taken from the enclosing `<MglMap>`.
 *
 * Accepts a plain map or a ref, so `useSource({ map: myMap, … })` works with a map created by hand.
 */
export type MapOrRef = MaplibreMap | ShallowRef<MaplibreMap | undefined> | Ref<MaplibreMap | undefined>;

/**
 * One synthesised context per raw map.
 *
 * Memoisation is not an optimisation here, it is a correctness requirement: a layer only knows its
 * source is ready by reading the *same* `MglSourceRegistry` the source wrote to. If every composable
 * built its own registry, `useLayer({ map })` would wait forever on a source added by
 * `useSource({ map })`. Keyed weakly so a discarded map takes its context with it.
 */
const synthesised = new WeakMap<MaplibreMap, MglMapContext>();

function contextFor(map: MaplibreMap): MglMapContext {
	let context = synthesised.get(map);
	if (context) {
		return context;
	}

	const isLoaded = ref(map.loaded());
	if (!isLoaded.value) {
		map.once('load', () => (isLoaded.value = true));
	}

	context = {
		map: shallowRef(map),
		isLoaded,
		emitter: mitt<MglEvents>(),
		sourceRegistry: new MglSourceRegistry(),
		controlRegistry: new ControlRegistry()
	};
	synthesised.set(map, context);
	return context;
}

/**
 * Resolves the map context a composable should work against.
 *
 * - **No argument** — reads the enclosing `<MglMap>` through inject. This is the normal path and what
 *   every component does.
 * - **A map** — works against that map instead, synthesising the pieces `<MglMap>` would have provided.
 *   This is what makes the composables usable outside this library's map component, e.g. on a map some
 *   other code created.
 *
 * Throws rather than failing silently when neither is available: the alternative is a composable that
 * quietly does nothing.
 */
export function useMapContext(explicit?: MapOrRef): MglMapContext {
	if (explicit) {
		const map = isRef(explicit) ? explicit.value : explicit;
		if (!map) {
			throw new Error('useMapContext: the `map` option was given but is empty.');
		}
		const context = contextFor(map);
		// keep the caller's ref identity if they passed one, so their own reactivity still drives it
		return isRef(explicit) ? { ...context, map: explicit } : context;
	}

	const map = inject(mapSymbol, undefined);
	if (!map) {
		throw new Error('useMapContext: no map found. Either call this inside an <MglMap> subtree, or pass `map` explicitly.');
	}

	return {
		map,
		isLoaded: inject(isLoadedSymbol)!,
		emitter: inject(emitterSymbol)!,
		sourceRegistry: inject(sourceRegistrySymbol)!,
		controlRegistry: inject(controlRegistrySymbol)!
	};
}
