import { useDisposableLayer } from '@/composable/useDisposableLayer';
import { LayerLib } from '@/lib/layer.lib';
import type { SymbolLayerSpecification } from 'maplibre-gl';
import { createCommentVNode, defineComponent, getCurrentInstance, type PropType } from 'vue';

export default /*#__PURE__*/ defineComponent({
	name : 'MglSymbolLayer',
	props: {
		...LayerLib.SHARED.props,
		layout: Object as PropType<SymbolLayerSpecification['layout']>,
		paint : Object as PropType<SymbolLayerSpecification['paint']>,
		filter: [ Boolean, Array ] as PropType<SymbolLayerSpecification['filter']>
	},
	emits: [ ...LayerLib.SHARED.emits ],
	setup(props) {

		const ci = getCurrentInstance()!;
		useDisposableLayer('symbol', props.source, props.layerId!, props, ci);

		return () => createCommentVNode('Symbol Layer');

	}
});
