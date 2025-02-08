import { useDisposableLayer } from '@/composable/useDisposableLayer';
import { LayerLib } from '@/lib/layer.lib';
import type { FillLayerSpecification } from 'maplibre-gl';
import { createCommentVNode, defineComponent, getCurrentInstance, type PropType } from 'vue';

export default /*#__PURE__*/ defineComponent({
	name : 'MglFillLayer',
	props: {
		...LayerLib.SHARED.props,
		layout: Object as PropType<FillLayerSpecification['layout']>,
		paint : Object as PropType<FillLayerSpecification['paint']>,
		filter: [ Boolean, Array ] as PropType<FillLayerSpecification['filter']>,
	},
	emits: [ ...LayerLib.SHARED.emits ],
	setup(props) {

		const ci = getCurrentInstance()!;
		useDisposableLayer('fill', props.source, props.layerId!, props, ci);

		return () => createCommentVNode('Fill Layer');

	}
});

