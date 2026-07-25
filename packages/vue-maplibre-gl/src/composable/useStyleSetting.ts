import type { Map as MaplibreMap } from 'maplibre-gl';
import { onScopeDispose, toValue, watch, type MaybeRefOrGetter } from 'vue';
import { useMapContext, type MapOrRef } from 'composable/useMapContext';

export interface UseStyleSettingOptions<T> {
	/** The value to apply. Reactive. */
	value: MaybeRefOrGetter<T>;
	/** Pushes the value into maplibre. Called once the style is ready, and on every change. */
	apply: (map: MaplibreMap, value: T) => void;
	/**
	 * Undoes the setting on unmount. Omit it for settings that have no meaningful "off" state.
	 *
	 * Most style setters take `null` to clear, which is why this is separate from `apply`.
	 */
	reset?: (map: MaplibreMap) => void;
	/** Work against this map instead of the enclosing `<MglMap>`. */
	map?: MapOrRef;
}

/**
 * Applies a style-level setting to the map and keeps it applied.
 *
 * `setTerrain`, `setSky`, `setLight`, `setProjection`, `setGlobalStateProperty` and `addImage` all share
 * the same awkward lifecycle: they can only be called once the style has loaded, **and** they are wiped by
 * every style switch, so they have to be re-applied on `style.load`. Getting that wrong is why declarative
 * terrain/sky wrappers usually break the moment a style is swapped.
 *
 * This factors that out, so `MglTerrain`, `MglSky`, `MglLight`, `MglProjection`, `MglImage` and
 * `MglGlobalState` are a few lines each.
 */
export function useStyleSetting<T>(opts: UseStyleSettingOptions<T>): void {
	const { map, isLoaded } = useMapContext(opts.map);

	function apply() {
		if (isLoaded.value && map.value) {
			opts.apply(map.value, toValue(opts.value));
		}
	}

	watch(isLoaded, apply, { immediate: true });
	watch(() => toValue(opts.value), apply, { deep: true });

	/* a style switch throws the setting away, so it has to be re-applied afterwards */
	const subscription = map.value!.on('style.load', apply);

	onScopeDispose(() => {
		subscription.unsubscribe();
		if (map.value && isLoaded.value) {
			opts.reset?.(map.value);
		}
	});
}
