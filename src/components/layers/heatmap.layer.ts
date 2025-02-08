import { useDisposableLayer } from '@/composable/useDisposableLayer';
import { LayerLib } from '@/lib/layer.lib';
import type { HeatmapLayerSpecification } from 'maplibre-gl';
import { createCommentVNode, defineComponent, getCurrentInstance, type PropType } from 'vue';

export default /*#__PURE__*/ defineComponent({
	name : 'MglHeatmapLayer',
	props: {
		...LayerLib.SHARED.props,
		layout: Object as PropType<HeatmapLayerSpecification['layout']>,
		paint : Object as PropType<HeatmapLayerSpecification['paint']>,
		filter: [ Boolean, Array ] as PropType<HeatmapLayerSpecification['filter']>
	},
	emits: [ ...LayerLib.SHARED.emits ],
	setup(props) {

		const ci = getCurrentInstance()!;
		useDisposableLayer('heatmap', props.source, props.layerId!, props, ci);

		return () => createCommentVNode('Heatmap Layer');

	}
});
