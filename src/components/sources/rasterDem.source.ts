import { useSource } from '@/composable/useSource';
import { AllSourceOptions } from '@/types';
import type { RasterDEMSourceSpecification, RasterDEMTileSource } from 'maplibre-gl';
import { createCommentVNode, defineComponent, type PropType, type SlotsType } from 'vue';

const sourceOpts = AllSourceOptions<RasterDEMSourceSpecification>({
	url        : undefined,
	tiles      : undefined,
	bounds     : undefined,
	minzoom    : undefined,
	maxzoom    : undefined,
	tileSize   : undefined,
	attribution: undefined,
	encoding   : undefined,
	volatile   : undefined,
	redFactor  : undefined,
	blueFactor : undefined,
	greenFactor: undefined,
	baseShift  : undefined
});


export default /*#__PURE__*/ defineComponent({
	name : 'MglRasterDemSource',
	props: {
		sourceId   : {
			type    : String as PropType<string>,
			required: true
		},
		url        : String as PropType<RasterDEMSourceSpecification['url']>,
		tiles      : Array as PropType<RasterDEMSourceSpecification['tiles']>,
		bounds     : Array as unknown as PropType<RasterDEMSourceSpecification['bounds']>,
		minzoom    : Number as PropType<RasterDEMSourceSpecification['minzoom']>,
		maxzoom    : Number as PropType<RasterDEMSourceSpecification['maxzoom']>,
		tileSize   : Number as PropType<RasterDEMSourceSpecification['tileSize']>,
		attribution: String as PropType<RasterDEMSourceSpecification['attribution']>,
		encoding   : String as PropType<RasterDEMSourceSpecification['encoding']>,
		volatile   : Boolean as PropType<RasterDEMSourceSpecification['volatile']>,
		redFactor  : Number as PropType<RasterDEMSourceSpecification['redFactor']>,
		blueFactor : Number as PropType<RasterDEMSourceSpecification['blueFactor']>,
		greenFactor: Number as PropType<RasterDEMSourceSpecification['greenFactor']>,
		baseShift  : Number as PropType<RasterDEMSourceSpecification['baseShift']>
	},
	slots: Object as SlotsType<{ default: {} }>,
	setup(props, { slots }) {

		const source = useSource<RasterDEMTileSource, RasterDEMSourceSpecification>(props, 'raster-dem', sourceOpts);

		return () => [
			createCommentVNode('RasterDem Source'),
			source.value && slots.default ? slots.default({}) : undefined
		];

	}
});
