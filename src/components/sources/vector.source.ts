import { useSource } from '@/composable/useSource';
import { AllSourceOptions } from '@/types';
import type { VectorSourceSpecification, VectorTileSource } from 'maplibre-gl';
import { createCommentVNode, defineComponent, isRef, type PropType, type SlotsType, watch } from 'vue';

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
		url        : String as PropType<VectorSourceSpecification['url']>,
		tiles      : Array as PropType<VectorSourceSpecification['tiles']>,
		bounds     : Array as unknown as PropType<VectorSourceSpecification['bounds']>,
		scheme     : String as PropType<VectorSourceSpecification['scheme']>,
		minzoom    : Number as PropType<VectorSourceSpecification['minzoom']>,
		maxzoom    : Number as PropType<VectorSourceSpecification['maxzoom']>,
		attribution: String as PropType<VectorSourceSpecification['attribution']>,
		promoteId  : [ Object, String ] as PropType<VectorSourceSpecification['promoteId']>,
		volatile   : Boolean as PropType<VectorSourceSpecification['volatile']>
	},
	slots: Object as SlotsType<{ default: {} }>,
	setup(props, { slots }) {

		const source = useSource<VectorTileSource, VectorSourceSpecification>(props, 'vector', sourceOpts);

		watch(isRef(props.tiles) ? props.tiles : () => props.tiles, v => {
			source.value?.setTiles(v as string[] || []);
		}, { immediate: true });
		watch(isRef(props.url) ? props.url : () => props.url, v => {
			source.value?.setUrl(v as string || '');
		}, { immediate: true });

		return () => [
			createCommentVNode('Vector Source'),
			source.value && slots.default ? slots.default({}) : undefined
		];

	}
});
