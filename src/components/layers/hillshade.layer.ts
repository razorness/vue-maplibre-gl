import { useDisposableLayer } from '@/composable/useDisposableLayer';
import { LayerLib } from '@/lib/layer.lib';
import type { HillshadeLayerSpecification } from 'maplibre-gl';
import { createCommentVNode, defineComponent, getCurrentInstance, type PropType } from 'vue';

export default /*#__PURE__*/ defineComponent({
	name : 'MglHillshadeLayer',
	props: {
		...LayerLib.SHARED.props,
		layout: Object as PropType<HillshadeLayerSpecification['layout']>,
		paint : Object as PropType<HillshadeLayerSpecification['paint']>,
		filter: [ Boolean, Array ] as PropType<HillshadeLayerSpecification['filter']>
	},
	emits: [ ...LayerLib.SHARED.emits ],
	setup(props) {

		const ci = getCurrentInstance()!;
		useDisposableLayer('hillshade', props.source, props.layerId!, props, ci);

		return () => createCommentVNode('Hillshade Layer');

	}
});
