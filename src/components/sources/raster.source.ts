import { useSource } from '@/composable/useSource';
import { AllSourceOptions } from '@/types';
import type { RasterSourceSpecification, RasterTileSource } from 'maplibre-gl';
import { createCommentVNode, defineComponent, type PropType, type SlotsType } from 'vue';

const sourceOpts = AllSourceOptions<RasterSourceSpecification>({
	url        : undefined,
	tiles      : undefined,
	bounds     : undefined,
	minzoom    : undefined,
	maxzoom    : undefined,
	tileSize   : undefined,
	scheme     : undefined,
	attribution: undefined,
	volatile   : undefined
});

export default /*#__PURE__*/ defineComponent({
	name : 'MglRasterSource',
	props: {
		sourceId   : {
			type    : String as PropType<string>,
			required: true
		},
		url        : String as PropType<RasterSourceSpecification['url']>,
		tiles      : Array as PropType<RasterSourceSpecification['tiles']>,
		bounds     : Array as unknown as PropType<RasterSourceSpecification['bounds']>,
		minzoom    : Number as PropType<RasterSourceSpecification['minzoom']>,
		maxzoom    : Number as PropType<RasterSourceSpecification['maxzoom']>,
		tileSize   : Number as PropType<RasterSourceSpecification['tileSize']>,
		scheme     : String as PropType<RasterSourceSpecification['scheme']>,
		attribution: String as PropType<RasterSourceSpecification['attribution']>,
		volatile   : Boolean as PropType<RasterSourceSpecification['volatile']>
	},
	slots: Object as SlotsType<{ default: {} }>,
	setup(props, { slots }) {

		const source = useSource<RasterTileSource, RasterSourceSpecification>(props, 'raster', sourceOpts);

		return () => [
			createCommentVNode('Raster Source'),
			source.value && slots.default ? slots.default({}) : undefined
		];

	}
});
