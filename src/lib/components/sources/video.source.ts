import { createCommentVNode, defineComponent, inject, PropType, provide, toRef, watch } from 'vue';
import { componentIdSymbol, sourceIdSymbol, sourceLayerRegistry } from '@/lib/types';
import { Coordinates, VideoSource, VideoSourceSpecification } from 'maplibre-gl';
import { SourceLayerRegistry } from '@/lib/lib/sourceLayer.registry';
import { SourceLib } from '@/lib/lib/source.lib';
import { useSource } from '@/lib/composable/useSource';

const sourceOpts: Array<keyof VideoSourceSpecification> = [ 'urls', 'coordinates' ];

export default defineComponent({
	name : 'MglVideoSource',
	props: {
		sourceId   : {
			type    : String as PropType<string>,
			required: true
		},
		urls       : Array as PropType<string[]>,
		coordinates: Array as unknown as PropType<Coordinates>
	},
	setup(props) {

		const cid      = inject(componentIdSymbol)!,
			  source   = SourceLib.getSourceRef<VideoSource>(cid, props.sourceId),
			  registry = new SourceLayerRegistry();

		provide(sourceIdSymbol, props.sourceId);
		provide(sourceLayerRegistry, registry);

		useSource<VideoSourceSpecification>(source, props, 'video', sourceOpts, registry);

		watch(toRef(props, 'coordinates'), v => {
			if (v) {
				source.value?.setCoordinates(v);
			}
		});

		return { source };

	},
	render() {
		return createCommentVNode('Video Source');
	}
});
