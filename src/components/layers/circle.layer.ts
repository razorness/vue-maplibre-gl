import { useDisposableLayer } from '@/composable/useDisposableLayer';
import { LayerLib } from '@/lib/layer.lib';
import type { CircleLayerSpecification } from 'maplibre-gl';
import { createCommentVNode, defineComponent, getCurrentInstance, type PropType } from 'vue';

export default /*#__PURE__*/ defineComponent({
	name : 'MglCircleLayer',
	props: {
		...LayerLib.SHARED.props,
		layout: Object as PropType<CircleLayerSpecification['layout']>,
		paint : Object as PropType<CircleLayerSpecification['paint']>,
		filter: [ Boolean, Array ] as PropType<CircleLayerSpecification['filter']>
	},
	emits: [ ...LayerLib.SHARED.emits ],
	setup(props) {

		const ci = getCurrentInstance()!;
		useDisposableLayer('circle', props.source, props.layerId!, props, ci);

		return () => createCommentVNode('Circle Layer');

	}
});
