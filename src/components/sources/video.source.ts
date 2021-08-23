import { createCommentVNode, defineComponent, inject, PropType, provide, watch } from 'vue';
import { componentIdSymbol, emitterSymbol, isLoadedSymbol, mapSymbol, sourceIdSymbol } from '@/components/types';
import { VideoSource, VideoSourceOptions } from 'maplibre-gl';
import { bindSource, getSourceRef } from '@/components/sources/shared';

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

		const map      = inject(mapSymbol)!,
			  isLoaded = inject(isLoadedSymbol)!,
			  emitter  = inject(emitterSymbol)!,
			  cid      = inject(componentIdSymbol)!,
			  source   = getSourceRef<VideoSource>(cid, props.sourceId);

		provide(sourceIdSymbol, props.sourceId);

		bindSource(map, source, isLoaded, emitter, props, 'video', sourceOpts);
		watch(() => props.coordinates, v => source.value?.setCoordinates(v || []));

		return { source };
	},
	render() {
		return createCommentVNode('Video Source');
	}
});
