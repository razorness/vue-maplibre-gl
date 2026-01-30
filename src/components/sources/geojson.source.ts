import { useSource } from '@/composable/useSource';
import { AllSourceOptions } from '@/types';
import type GeoJSON from 'geojson';
import type { GeoJSONSource, GeoJSONSourceSpecification } from 'maplibre-gl';
import { createCommentVNode, defineComponent, isRef, type PropType, type SlotsType, watch } from 'vue';

const sourceOpts = AllSourceOptions<GeoJSONSourceSpecification>({
	data             : undefined,
	maxzoom          : undefined,
	attribution      : undefined,
	buffer           : undefined,
	tolerance        : undefined,
	cluster          : undefined,
	clusterRadius    : undefined,
	clusterMaxZoom   : undefined,
	clusterMinPoints : undefined,
	clusterProperties: undefined,
	lineMetrics      : undefined,
	generateId       : undefined,
	promoteId        : undefined,
	filter           : undefined,
});

type DataType = GeoJSON.Feature<GeoJSON.Geometry> | GeoJSON.FeatureCollection<GeoJSON.Geometry> | string;


export default /*#__PURE__*/ defineComponent({
	name : 'MglGeoJsonSource',
	props: {
		sourceId         : {
			type    : String as PropType<string>,
			required: true
		},
		data             : [ Object, String ] as PropType<GeoJSONSourceSpecification['data']>,
		maxzoom          : Number as PropType<GeoJSONSourceSpecification['maxzoom']>,
		attribution      : String as PropType<GeoJSONSourceSpecification['attribution']>,
		buffer           : Number as PropType<GeoJSONSourceSpecification['buffer']>,
		tolerance        : Number as PropType<GeoJSONSourceSpecification['tolerance']>,
		cluster          : [ Number, Boolean ] as PropType<GeoJSONSourceSpecification['cluster']>,
		clusterRadius    : Number as PropType<GeoJSONSourceSpecification['clusterRadius']>,
		clusterMaxZoom   : Number as PropType<GeoJSONSourceSpecification['clusterMaxZoom']>,
		clusterMinPoints : Number as PropType<GeoJSONSourceSpecification['clusterMinPoints']>,
		clusterProperties: Object as PropType<GeoJSONSourceSpecification['clusterProperties']>,
		lineMetrics      : Boolean as PropType<GeoJSONSourceSpecification['lineMetrics']>,
		generateId       : Boolean as PropType<GeoJSONSourceSpecification['generateId']>,
		promoteId        : [ Object, String ] as PropType<GeoJSONSourceSpecification['promoteId']>,
		filter           : [ Array, String, Object ] as PropType<GeoJSONSourceSpecification['filter']>
	},
	slots: Object as SlotsType<{ default: {} }>,
	setup(props, { slots }) {

		const source = useSource<GeoJSONSource, GeoJSONSourceSpecification>(props, 'geojson', sourceOpts);

		watch(isRef(props.data) ? props.data : () => props.data, v => {
			source.value?.setData(v as DataType || { type: 'FeatureCollection', features: [] });
		}, { immediate: true });

		return () => [
			createCommentVNode('GeoJSON Source'),
			source.value && slots.default ? slots.default({}) : undefined
		];

	}
});
