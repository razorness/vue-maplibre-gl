import { useSource } from '@/composable/useSource';
import { AllSourceOptions } from '@/types';
import type GeoJSON from 'geojson';
import type { GeoJSONSource, GeoJSONSourceOptions, GeoJSONSourceSpecification } from 'maplibre-gl';
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
		data             : [ Object, String ] as PropType<GeoJSONSourceOptions['data']>,
		maxzoom          : Number as PropType<GeoJSONSourceOptions['maxzoom']>,
		attribution      : String as PropType<GeoJSONSourceOptions['attribution']>,
		buffer           : Number as PropType<GeoJSONSourceOptions['buffer']>,
		tolerance        : Number as PropType<GeoJSONSourceOptions['tolerance']>,
		cluster          : [ Number, Boolean ] as PropType<GeoJSONSourceOptions['cluster']>,
		clusterRadius    : Number as PropType<GeoJSONSourceOptions['clusterRadius']>,
		clusterMaxZoom   : Number as PropType<GeoJSONSourceOptions['clusterMaxZoom']>,
		clusterMinPoints : Number as PropType<GeoJSONSourceOptions['clusterMinPoints']>,
		clusterProperties: Object as PropType<GeoJSONSourceOptions['clusterProperties']>,
		lineMetrics      : Boolean as PropType<GeoJSONSourceOptions['lineMetrics']>,
		generateId       : Boolean as PropType<GeoJSONSourceOptions['generateId']>,
		promoteId        : [ Object, String ] as PropType<GeoJSONSourceOptions['promoteId']>,
		filter           : [ Array, String, Object ] as PropType<GeoJSONSourceOptions['filter']>
	},
	slots: Object as SlotsType<{ default: {} }>,
	setup(props, { slots }) {

		const source = useSource<GeoJSONSource, GeoJSONSourceOptions>(props, 'geojson', sourceOpts);

		watch(isRef(props.data) ? props.data : () => props.data, v => {
			source.value?.setData(v as DataType || { type: 'FeatureCollection', features: [] });
		}, { immediate: true });

		return () => [
			createCommentVNode('GeoJSON Source'),
			source.value && slots.default ? slots.default({}) : undefined
		];

	}
});
