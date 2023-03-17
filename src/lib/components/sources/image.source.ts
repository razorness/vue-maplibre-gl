import { createCommentVNode, defineComponent, inject, PropType, provide, watch } from 'vue';
import { componentIdSymbol, sourceIdSymbol, sourceLayerRegistry } from '@/lib/types';
import { ImageSource, ImageSourceOptions } from 'maplibre-gl';
import { SourceLayerRegistry } from '@/lib/lib/sourceLayer.registry';
import { SourceLib } from '@/lib/lib/source.lib';
import { useSource } from '@/lib/composable/useSource';

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

		const cid      = inject(componentIdSymbol)!,
			  source   = SourceLib.getSourceRef<ImageSource>(cid, props.sourceId),
			  registry = new SourceLayerRegistry();

		provide(sourceIdSymbol, props.sourceId);
		provide(sourceLayerRegistry, registry);

		useSource<ImageSourceOptions>(source, props, 'image', sourceOpts, registry);

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
