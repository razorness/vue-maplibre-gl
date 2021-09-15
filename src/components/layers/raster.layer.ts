import { RasterLayer, RasterLayout, RasterPaint } from 'maplibre-gl';
import { genLayerOpts, handleDispose, registerLayerEvents, Shared } from '@/components/layers/shared';
import { createCommentVNode, defineComponent, getCurrentInstance, inject, PropType, warn, watch } from 'vue';
import { componentIdSymbol, isLoadedSymbol, mapSymbol, sourceIdSymbol, sourceLayerRegistry } from '@/components/types';
import { getSourceRef } from '@/components/sources/shared';

export default defineComponent({
	name  : 'MglRasterLayer',
	mixins: [ Shared ],
	props : {
		layout: Object as PropType<RasterLayout>,
		paint : Object as PropType<RasterPaint>
	},
	setup(props) {

		const sourceId = inject(sourceIdSymbol);

		if (!sourceId && !props.source) {
			warn('Raster Layer: layer must be used inside source tag or source prop must be set');
			return;
		}

		const ci        = getCurrentInstance()!,
			  map       = inject(mapSymbol)!,
			  isLoaded  = inject(isLoadedSymbol)!,
			  cid       = inject(componentIdSymbol)!,
			  registry  = inject(sourceLayerRegistry)!,
			  sourceRef = getSourceRef(cid, props.source || sourceId);

		watch([ isLoaded, sourceRef ], ([ il, src ]) => {
			if (il && (src || src === undefined)) {
				map.value.addLayer(genLayerOpts<RasterLayer>(props.layerId, 'raster', props, sourceId), props.before || undefined);
				registerLayerEvents(map.value, props.layerId, ci.vnode);
			}
		}, { immediate: true });

		handleDispose(isLoaded, map, ci, props, registry);

	},
	render() {
		return createCommentVNode('Raster Layer');
	}
});
