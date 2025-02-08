import { useDisposableLayer } from '@/composable/useDisposableLayer';
import { LayerLib } from '@/lib/layer.lib';
import type { FillExtrusionLayerSpecification } from 'maplibre-gl';
import { createCommentVNode, defineComponent, getCurrentInstance, type PropType } from 'vue';

export default /*#__PURE__*/ defineComponent({
	name : 'MglFillExtrusionLayer',
	props: {
		...LayerLib.SHARED.props,
		layout: Object as PropType<FillExtrusionLayerSpecification['layout']>,
		paint : Object as PropType<FillExtrusionLayerSpecification['paint']>,
		filter: [ Boolean, Array ] as PropType<FillExtrusionLayerSpecification['filter']>
	},
	emits: [ ...LayerLib.SHARED.emits ],
	setup(props) {

		const ci = getCurrentInstance()!;
		useDisposableLayer('fill-extrusion', props.source, props.layerId!, props, ci);

		return () => createCommentVNode('Fill Extrusion Layer');

	}
});
