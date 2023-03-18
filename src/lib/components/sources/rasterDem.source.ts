import { createCommentVNode, defineComponent, inject, PropType, provide } from 'vue';
import { componentIdSymbol, sourceIdSymbol, sourceLayerRegistry } from '@/lib/types';
import { RasterDEMTileSource, RasterDEMSourceSpecification } from 'maplibre-gl';
import { SourceLayerRegistry } from '@/lib/lib/sourceLayer.registry';
import { SourceLib } from '@/lib/lib/source.lib';
import { useSource } from '@/lib/composable/useSource';

const sourceOpts: Array<keyof RasterDEMSourceSpecification> = [ 'url', 'tiles', 'bounds', 'minzoom', 'maxzoom', 'tileSize', 'attribution', 'encoding' ];

export default defineComponent({
	name : 'MglRasterDemSource',
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
		attribution: String as PropType<string>,
		encoding   : String as PropType<'terrarium' | 'mapbox'>
	},
	setup(props) {

		const cid      = inject(componentIdSymbol)!,
			  source   = SourceLib.getSourceRef<RasterDEMTileSource>(cid, props.sourceId),
			  registry = new SourceLayerRegistry();

		provide(sourceIdSymbol, props.sourceId);
		provide(sourceLayerRegistry, registry);

		useSource<RasterDEMSourceSpecification>(source, props, 'raster-dem', sourceOpts, registry);

		return { source };

	},
	render() {
		return createCommentVNode('Video Source');
	}
});
