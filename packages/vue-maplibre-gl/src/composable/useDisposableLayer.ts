import type { Map, Source } from 'maplibre-gl';
import { inject, onBeforeUnmount, warn, watch, type ComponentInternalInstance, type Ref, type ShallowRef } from 'vue';
import { LayerLib } from 'lib/layer.lib';
import { isLoadedSymbol, mapSymbol, sourceIdSymbol, sourceLayerRegistry, sourceRegistrySymbol } from 'types';

/**
 * Adds a layer once its source is ready, and removes it again on unmount.
 *
 * @deprecated Prefer the generic `<MglLayer type="…" :options="…"/>` component, which additionally
 * applies `paint`/`layout`/`filter`/zoom-range changes to the live layer — this composable is add-only.
 *
 * Kept because it is public API, and rebuilt on the same per-map source registry the components use.
 */
export function useDisposableLayer(
	type: string,
	sourceId: string | Source | undefined,
	layerId: string,
	props: any,
	ci?: ComponentInternalInstance
): {
	map: ShallowRef<Map | undefined>;
	isLoaded: Ref<boolean>;
	source: Ref<Source | null | undefined>;
} {
	const injectedSourceId = inject(sourceIdSymbol, undefined),
		currentSource = sourceId || injectedSourceId;

	if (!currentSource) {
		warn(`Layer (${layerId}): layer must be used inside source tag or source prop must be set`);
	}

	const map = inject(mapSymbol)!,
		isLoaded = inject(isLoadedSymbol)!,
		registry = inject(sourceRegistrySymbol)!,
		source = registry.get(typeof currentSource === 'string' ? currentSource : undefined),
		layerRegistry = inject(sourceLayerRegistry)!;

	function removeLayer() {
		if (isLoaded.value && map.value) {
			if (ci) {
				LayerLib.unregisterLayerEvents(map.value, layerId, ci.vnode);
			}
			if (map.value.getLayer(layerId)) {
				map.value.removeLayer(layerId);
			}
		}
	}

	layerRegistry.registerUnmountHandler(layerId, removeLayer);
	onBeforeUnmount(() => {
		layerRegistry.unregisterUnmountHandler(layerId);
		removeLayer();
	});

	watch(
		[isLoaded, source],
		([loaded, resolvedSource]) => {
			// `undefined` means there is no source to wait for; `null` means "not ready yet"
			if (loaded && (resolvedSource || resolvedSource === undefined)) {
				map.value!.addLayer(LayerLib.genLayerOpts(layerId, type, props, currentSource), props.before || undefined);
				if (ci) {
					LayerLib.registerLayerEvents(map.value!, layerId, ci.vnode);
				}
			}
		},
		{ immediate: true }
	);

	return { map, isLoaded, source };
}
