import { useDisposableLayer } from '@/composable/useDisposableLayer';
import { LayerLib } from '@/lib/layer.lib';
import type { RasterLayerSpecification } from 'maplibre-gl';
import { createCommentVNode, defineComponent, getCurrentInstance, type PropType } from 'vue';

export default /*#__PURE__*/ defineComponent({
	name : 'MglRasterLayer',
	props: {
		...LayerLib.SHARED.props,
		layout: Object as PropType<RasterLayerSpecification['layout']>,
		paint : Object as PropType<RasterLayerSpecification['paint']>,
		filter: [ Boolean, Array ] as PropType<RasterLayerSpecification['filter']>
	},
	emits: [ ...LayerLib.SHARED.emits ],
	setup(props) {

		const ci = getCurrentInstance()!;
		useDisposableLayer('raster', props.source, props.layerId!, props, ci);

		return () => createCommentVNode('Raster Layer');

	}
});
