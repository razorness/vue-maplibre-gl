import { createCommentVNode, defineComponent, inject, PropType, provide } from 'vue';
import { componentIdSymbol, sourceIdSymbol, sourceLayerRegistry } from '@/lib/types';
import { RasterSourceSpecification, RasterTileSource } from 'maplibre-gl';
import { SourceLayerRegistry } from '@/lib/lib/sourceLayer.registry';
import { SourceLib } from '@/lib/lib/source.lib';
import { useSource } from '@/lib/composable/useSource';

const sourceOpts: Array<keyof RasterSourceSpecification> = [ 'url', 'tiles', 'bounds', 'minzoom', 'maxzoom', 'tileSize', 'scheme', 'attribution' ];

export default defineComponent({
	name : 'MglRasterSource',
	props: {
		sourceId   : {
			type    : String as PropType<string>,
			required: true
		},
		url        : String as PropType<string>,
		tiles      : Array as PropType<string[]>,
		bounds     : Array as PropType<number[]>,
		minzoom    : Number as PropType<number>,
		maxzoom    : Number as PropType<number>,
		tileSize   : Number as PropType<number>,
		scheme     : String as PropType<'xyz' | 'tms'>,
		attribution: String as PropType<string>
	},
	setup(props) {

		const cid      = inject(componentIdSymbol)!,
			  source   = SourceLib.getSourceRef<RasterTileSource>(cid, props.sourceId),
			  registry = new SourceLayerRegistry();

		provide(sourceIdSymbol, props.sourceId);
		provide(sourceLayerRegistry, registry);

		useSource<RasterSourceSpecification>(source, props, 'raster', sourceOpts, registry);

		return { source };

	},
	render() {
		return createCommentVNode('Video Source');
	}
});
