import { createCommentVNode, defineComponent, inject, PropType, provide, watch } from 'vue';
import { componentIdSymbol, sourceIdSymbol, sourceLayerRegistry } from '@/components/types';
import { PromoteIdSpecification, VectorSource, VectorSourceImpl } from 'maplibre-gl';
import { SourceLayerRegistry } from '@/lib/sourceLayer.registry';
import { SourceLib } from '@/lib/source.lib';
import { useSource } from '@/composable/useSource';

const sourceOpts: Array<keyof VectorSource> = [ 'url', 'tiles', 'bounds', 'scheme', 'minzoom', 'maxzoom', 'attribution', 'promoteId' ];

export default defineComponent({
	name : 'MglVectorSource',
	props: {
		sourceId   : {
			type    : String as PropType<string>,
			required: true
		},
		url        : String as PropType<string>,
		tiles      : Array as PropType<string[]>,
		bounds     : Array as PropType<number[]>,
		scheme     : String as PropType<'xyz' | 'tms'>,
		minzoom    : Number as PropType<number>,
		maxzoom    : Number as PropType<number>,
		attribution: String as PropType<string>,
		promoteId  : [ Object, String ] as PropType<PromoteIdSpecification>
	},
	setup(props) {

		const cid      = inject(componentIdSymbol)!,
			  source   = SourceLib.getSourceRef<VectorSourceImpl>(cid, props.sourceId),
			  registry = new SourceLayerRegistry();

		provide(sourceIdSymbol, props.sourceId);
		provide(sourceLayerRegistry, registry);

		useSource<VectorSource>(source, props, 'vector', sourceOpts, registry);

		watch(() => props.tiles, v => source.value?.setTiles(v || []));
		watch(() => props.url, v => source.value?.setUrl(v || ''));

		return { source };

	},
	render() {
		return createCommentVNode('Vector Source');
	}
});
