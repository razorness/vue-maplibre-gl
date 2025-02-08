import { useDisposableLayer } from '@/composable/useDisposableLayer';
import { LayerLib } from '@/lib/layer.lib';
import type { LineLayerSpecification } from 'maplibre-gl';
import { createCommentVNode, defineComponent, getCurrentInstance, type PropType } from 'vue';

export default /*#__PURE__*/ defineComponent({
	name : 'MglLineLayer',
	props: {
		...LayerLib.SHARED.props,
		layout: Object as PropType<LineLayerSpecification['layout']>,
		paint : Object as PropType<LineLayerSpecification['paint']>,
		filter: [ Boolean, Array ] as PropType<LineLayerSpecification['filter']>
	},
	emits: [ ...LayerLib.SHARED.emits ],
	setup(props) {

		const ci = getCurrentInstance()!;
		useDisposableLayer('line', props.source, props.layerId!, props, ci);

		return () => createCommentVNode('Line Layer');

	}
});
