import { LayerLib } from '@/lib/layer.lib';
import { SourceLib } from '@/lib/source.lib.ts';
import { componentIdSymbol, isLoadedSymbol, mapSymbol, sourceIdSymbol, sourceLayerRegistry } from '@/types';
import type { ComponentInternalInstance } from '@vue/runtime-core';
import type { LayerSpecification, Map, Source } from 'maplibre-gl';
import { inject, onBeforeUnmount, type Ref, type ShallowRef, warn, watch } from 'vue';

export function useDisposableLayer(type: string, sourceId: string | Source | undefined, layerId: string, props: any, ci?: ComponentInternalInstance): {
	map: ShallowRef<Map | undefined>,
	isLoaded: Ref<boolean>,
	source: Ref<Source | null | undefined>
} {

	const sourceIdInject  = inject(sourceIdSymbol),
		  currentSourceId = sourceId || sourceIdInject;

	if (!currentSourceId) {
		warn(`Layer (${layerId}): layer must be used inside source tag or source prop must be set`);
	}

	const map      = inject(mapSymbol)!,
		  isLoaded = inject(isLoadedSymbol)!,
		  cid      = inject(componentIdSymbol)!,
		  source   = SourceLib.getSourceRef(cid, currentSourceId);

	const registry = inject(sourceLayerRegistry)!;

	function removeLayer() {
		if (isLoaded.value) {
			if (ci) {
				LayerLib.unregisterLayerEvents(map.value!, layerId, ci.vnode);
			}
			const layer = map.value!.getLayer(layerId);
			if (layer) {
				map.value!.removeLayer(layerId);
			}
		}
	}

	registry.registerUnmountHandler(layerId, removeLayer);
	onBeforeUnmount(() => {
		registry.unregisterUnmountHandler(layerId);
		removeLayer();
	});

	watch([ isLoaded, source ], ([ il, src ]) => {
		if (il && (src || src === undefined)) {
			map.value!.addLayer(LayerLib.genLayerOpts<LayerSpecification>(layerId!, type, props, currentSourceId), props.before || undefined);
			if (ci) {
				LayerLib.registerLayerEvents(map.value!, props.layerId!, ci.vnode);
			}
		}
	}, { immediate: true });


	return { map, isLoaded, source };

}
