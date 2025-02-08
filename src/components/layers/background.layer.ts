import { useDisposableLayer } from '@/composable/useDisposableLayer';
import { LayerLib } from '@/lib/layer.lib';
import type { BackgroundLayerSpecification } from 'maplibre-gl';
import { createCommentVNode, defineComponent, type PropType } from 'vue';

export default /*#__PURE__*/ defineComponent({
	name : 'MglBackgroundLayer',
	props: {
		...LayerLib.SHARED.props,
		layout: Object as PropType<BackgroundLayerSpecification['layout']>,
		paint : Object as PropType<BackgroundLayerSpecification['paint']>
	},
	emits: [ ...LayerLib.SHARED.emits ],
	setup(props) {

		useDisposableLayer('background', props.source, props.layerId!, props);

		return () => createCommentVNode('Background Layer');

	}
});
