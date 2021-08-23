import { createCommentVNode, defineComponent, inject, PropType, provide, watch } from 'vue';
import { componentIdSymbol, emitterSymbol, isLoadedSymbol, mapSymbol, sourceIdSymbol } from '@/components/types';
import { ImageSource, ImageSourceOptions } from 'maplibre-gl';
import { bindSource, getSourceRef } from '@/components/sources/shared';

const sourceOpts: Array<keyof ImageSourceOptions> = [ 'url', 'coordinates' ];

export default defineComponent({
	name : 'MglImageSource',
	props: {
		sourceId   : {
			type    : String as PropType<string>,
			required: true
		},
		url        : String as PropType<string>,
		coordinates: Array as PropType<number[][]>
	},
	setup(props) {

		const map      = inject(mapSymbol)!,
			  isLoaded = inject(isLoadedSymbol)!,
			  emitter  = inject(emitterSymbol)!,
			  cid      = inject(componentIdSymbol)!,
			  source   = getSourceRef<ImageSource>(cid, props.sourceId);

		provide(sourceIdSymbol, props.sourceId);

		bindSource(map, source, isLoaded, emitter, props, 'image', sourceOpts);
		watch(() => props.coordinates, v => source.value?.setCoordinates(v || []));

		return { source };
	},
	render() {
		return [
			createCommentVNode('Image Source'),
			this.source && this.$slots.default ? this.$slots.default() : undefined
		];
	}
});
