import { FillLayer, FillLayout, FillPaint } from 'maplibre-gl';
import { genLayerOpts, Shared } from '@/components/layers/shared';
import { createCommentVNode, defineComponent, inject, onBeforeUnmount, PropType, warn, watch } from 'vue';
import { componentIdSymbol, isLoadedSymbol, mapSymbol, sourceIdSymbol } from '@/components/types';
import { getSourceRef } from '@/components/sources/shared';

export default defineComponent({
	name  : 'MglFillLayer',
	mixins: [ Shared ],
	props : {
		layout: Object as PropType<FillLayout>,
		paint : Object as PropType<FillPaint>
	},
	setup(props) {

		const sourceId = inject(sourceIdSymbol);

		if (!sourceId && !props.source) {
			warn('Fill Layer: layer must be used inside source tag or source prop must be set');
			return;
		}

		const map       = inject(mapSymbol)!,
			  isLoaded  = inject(isLoadedSymbol)!,
			  cid       = inject(componentIdSymbol)!,
			  sourceRef = getSourceRef(cid, props.source || sourceId);

		watch([ isLoaded, sourceRef ], ([ il, src ]) => {
			if (il && (src || src === undefined)) {
				map.value.addLayer(genLayerOpts<FillLayer>(props.layerId, 'fill', props, sourceId), props.before || undefined);
			}
		}, { immediate: true });

		onBeforeUnmount(() => {
			if (isLoaded.value) map.value.removeLayer(props.layerId);
		});


	},
	render() {
		return createCommentVNode('Fill Layer');
	}
});
