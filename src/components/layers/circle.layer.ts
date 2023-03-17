import { CircleLayer, CircleLayout, CirclePaint } from 'maplibre-gl';
import { createCommentVNode, defineComponent, getCurrentInstance, inject, PropType, warn, watch } from 'vue';
import { componentIdSymbol, isLoadedSymbol, mapSymbol, sourceIdSymbol } from '@/components/types';
import { useDisposableLayer } from '@/composable/useDisposableLayer';
import { LayerLib } from '@/lib/layer.lib';
import { SourceLib } from '@/lib/source.lib';

export default defineComponent({
	name : 'MglCircleLayer',
	props: {
		...LayerLib.SHARED.props,
		layout: Object as PropType<CircleLayout>,
		paint : Object as PropType<CirclePaint>
	},
	emits: [ ...LayerLib.SHARED.emits ],
	setup(props) {

		const sourceId = inject(sourceIdSymbol);

		if (!sourceId && !props.source) {
			warn('Circle Layer: layer must be used inside source tag or source prop must be set');
			return;
		}

		const ci        = getCurrentInstance()!,
			  map       = inject(mapSymbol)!,
			  isLoaded  = inject(isLoadedSymbol)!,
			  cid       = inject(componentIdSymbol)!,
			  sourceRef = SourceLib.getSourceRef(cid, props.source || sourceId);

		useDisposableLayer(props.layerId!, ci);

		watch([ isLoaded, sourceRef ], ([ il, src ]) => {
			if (il && (src || src === undefined)) {
				map.value.addLayer(LayerLib.genLayerOpts<CircleLayer>(props.layerId!, 'circle', props, sourceId), props.before || undefined);
				LayerLib.registerLayerEvents(map.value, props.layerId!, ci.vnode);
			}
		}, { immediate: true });

	},
	render() {
		return createCommentVNode('Circle Layer');
	}
});
