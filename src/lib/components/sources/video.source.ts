import { createCommentVNode, defineComponent, inject, PropType, provide, watch } from 'vue';
import { componentIdSymbol, sourceIdSymbol, sourceLayerRegistry } from '@/lib/types';
import { VideoSource, VideoSourceOptions } from 'maplibre-gl';
import { SourceLayerRegistry } from '@/lib/lib/sourceLayer.registry';
import { SourceLib } from '@/lib/lib/source.lib';
import { useSource } from '@/lib/composable/useSource';

const sourceOpts: Array<keyof VideoSourceOptions> = [ 'urls', 'coordinates' ];

export default defineComponent({
	name : 'MglVideoSource',
	props: {
		sourceId   : {
			type    : String as PropType<string>,
			required: true
		},
		urls       : Array as PropType<string[]>,
		coordinates: Array as PropType<number[][]>
	},
	setup(props) {

		const cid      = inject(componentIdSymbol)!,
			  source   = SourceLib.getSourceRef<VideoSource>(cid, props.sourceId),
			  registry = new SourceLayerRegistry();

		provide(sourceIdSymbol, props.sourceId);
		provide(sourceLayerRegistry, registry);

		useSource<VideoSourceOptions>(source, props, 'video', sourceOpts, registry);

		watch(() => props.coordinates, v => source.value?.setCoordinates(v || []));

		return { source };

	},
	render() {
		return createCommentVNode('Video Source');
	}
});
