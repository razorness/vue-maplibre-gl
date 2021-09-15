import { createCommentVNode, defineComponent, inject, PropType, provide, watch } from 'vue';
import { componentIdSymbol, emitterSymbol, isLoadedSymbol, mapSymbol, sourceIdSymbol, sourceLayerRegistry } from '@/components/types';
import { ImageSource, ImageSourceOptions } from 'maplibre-gl';
import { bindSource, getSourceRef } from '@/components/sources/shared';
import { SourceLayerRegistry } from '@/components/sources/sourceLayer.registry';

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
			  source   = getSourceRef<ImageSource>(cid, props.sourceId),
			  registry = new SourceLayerRegistry();

		provide(sourceIdSymbol, props.sourceId);
		provide(sourceLayerRegistry, registry);

		bindSource(map, source, isLoaded, emitter, props, 'image', sourceOpts, registry);
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
