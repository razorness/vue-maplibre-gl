import type { MapEventType, MapLayerEventType, Map as MaplibreMap } from 'maplibre-gl';
import { onBeforeUnmount, onScopeDispose, watch } from 'vue';
import { useMapContext, type MapOrRef } from 'composable/useMapContext';

/**
 * Subscribes to a map event for as long as the calling component lives.
 *
 * Uses the `Subscription` maplibre v6 returns from `on()`, so there is no handler bookkeeping and no
 * risk of `off()` being called with a different function reference than `on()` received.
 *
 * ```ts
 * useMapEvent('moveend', e => console.log(e.target.getCenter()));
 * ```
 */
export function useMapEvent<T extends keyof MapEventType>(event: T, handler: (ev: MapEventType[T]) => void, map?: MapOrRef): void {
	const context = useMapContext(map),
		subscription = context.map.value!.on(event, handler);

	onScopeDispose(() => subscription.unsubscribe(), true);
}

/**
 * Subscribes to an event on a specific layer for as long as the calling component lives.
 *
 * Layer events need maplibre's `(event, layerId, handler)` overload, which Vue's emit system cannot
 * express — this is the composable equivalent of putting `@click` on `<MglLayer>`.
 *
 * ```ts
 * useLayerEvent('click', 'my-circles', e => console.log(e.features));
 * ```
 */
export function useLayerEvent<T extends keyof MapLayerEventType>(
	event: T,
	layerId: string,
	handler: (ev: MapLayerEventType[T]) => void,
	map?: MapOrRef
): void {
	const context = useMapContext(map),
		subscription = context.map.value!.on(event, layerId, handler);

	onScopeDispose(() => subscription.unsubscribe(), true);
}

/**
 * Runs `handler` once the map's style has loaded, immediately if that already happened.
 *
 * Saves the `watch(isLoaded, …, { immediate: true })` dance that every component doing imperative
 * map work otherwise repeats.
 */
export function onMapLoad(handler: (map: MaplibreMap) => void, explicitMap?: MapOrRef): void {
	const { map, isLoaded } = useMapContext(explicitMap);

	const stop = watch(
		isLoaded,
		loaded => {
			if (loaded && map.value) {
				handler(map.value);
			}
		},
		{ immediate: true }
	);

	onBeforeUnmount(stop);
}
