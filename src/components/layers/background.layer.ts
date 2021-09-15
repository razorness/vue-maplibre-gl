import { BackgroundLayer, BackgroundLayout, BackgroundPaint } from 'maplibre-gl';
import { genLayerOpts, Shared } from '@/components/layers/shared';
import { createCommentVNode, defineComponent, inject, onBeforeUnmount, PropType, warn, watch } from 'vue';
import { componentIdSymbol, isLoadedSymbol, mapSymbol, sourceIdSymbol, sourceLayerRegistry } from '@/components/types';
import { getSourceRef } from '@/components/sources/shared';

export default defineComponent({
	name  : 'MglBackgroundLayer',
	mixins: [ Shared ],
	props : {
		layout: Object as PropType<BackgroundLayout>,
		paint : Object as PropType<BackgroundPaint>
	},
	setup(props) {

		const sourceId = inject(sourceIdSymbol);

		if (!sourceId && !props.source) {
			warn('Background Layer: layer must be used inside source tag or source prop must be set');
			return;
		}

		const map       = inject(mapSymbol)!,
			  isLoaded  = inject(isLoadedSymbol)!,
			  cid       = inject(componentIdSymbol)!,
			  registry  = inject(sourceLayerRegistry)!,
			  sourceRef = getSourceRef(cid, props.source || sourceId);

		watch([ isLoaded, sourceRef ], ([ il, src ]) => {
			if (il && (src || src === undefined)) {
				map.value.addLayer(genLayerOpts<BackgroundLayer>(props.layerId, 'background', props, sourceId), props.before || undefined);
			}
		}, { immediate: true });

		function removeLayer() {
			if (isLoaded.value) {
				map.value.removeLayer(props.layerId);
			}
		}

		registry.registerUnmountHandler(props.layerId, removeLayer);
		onBeforeUnmount(() => {
			removeLayer();
		});

	},
	render() {
		return createCommentVNode('Background Layer');
	}
});
