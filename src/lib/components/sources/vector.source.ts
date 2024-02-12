import { createCommentVNode, defineComponent, inject, type PropType, provide, type SlotsType, toRef, watch } from 'vue';
import { AllSourceOptions, componentIdSymbol, sourceIdSymbol, sourceLayerRegistry } from '@/lib/types';
import type { PromoteIdSpecification, VectorSourceSpecification, VectorTileSource } from 'maplibre-gl';
import { SourceLayerRegistry } from '@/lib/lib/sourceLayer.registry';
import { SourceLib } from '@/lib/lib/source.lib';
import { useSource } from '@/lib/composable/useSource';

const sourceOpts = AllSourceOptions<VectorSourceSpecification>({
	url        : undefined,
	tiles      : undefined,
	bounds     : undefined,
	scheme     : undefined,
	minzoom    : undefined,
	maxzoom    : undefined,
	attribution: undefined,
	promoteId  : undefined,
	volatile   : undefined
});

export default /*#__PURE__*/ defineComponent({
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
		promoteId  : [ Object, String ] as PropType<PromoteIdSpecification>,
		volatile   : Boolean
	},
	slots: Object as SlotsType<{ default: {} }>,
	setup(props, { slots }) {

		const cid      = inject(componentIdSymbol)!,
			  source   = SourceLib.getSourceRef<VectorTileSource>(cid, props.sourceId),
			  registry = new SourceLayerRegistry();

		provide(sourceIdSymbol, props.sourceId);
		provide(sourceLayerRegistry, registry);

		useSource<VectorSourceSpecification>(source, props, 'vector', sourceOpts, registry);

		watch(toRef(props, 'tiles'), v => source.value?.setTiles(v || []));
		watch(toRef(props, 'url'), v => source.value?.setUrl(v || ''));

		return () => [
			createCommentVNode('Vector Source'),
			source.value && slots.default ? slots.default({}) : undefined
		];

	}
});
