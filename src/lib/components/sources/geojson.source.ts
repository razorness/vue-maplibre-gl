import { createCommentVNode, defineComponent, inject, type PropType, provide, type SlotsType, watch } from 'vue';
import { AllSourceOptions, componentIdSymbol, sourceIdSymbol, sourceLayerRegistry } from '@/lib/types';
import type { GeoJSONSource, GeoJSONSourceOptions, GeoJSONSourceSpecification, PromoteIdSpecification } from 'maplibre-gl';
import { SourceLayerRegistry } from '@/lib/lib/sourceLayer.registry';
import type GeoJSON from 'geojson';
import { SourceLib } from '@/lib/lib/source.lib';
import { useSource } from '@/lib/composable/useSource';

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


export default /*#__PURE__*/ defineComponent({
	name : 'MglGeoJsonSource',
	props: {
		sourceId         : {
			type    : String as PropType<string>,
			required: true
		},
		data             : [ Object, String ] as PropType<GeoJSON.Feature<GeoJSON.Geometry> | GeoJSON.FeatureCollection<GeoJSON.Geometry> | string>,
		maxzoom          : Number as PropType<number>,
		attribution      : String as PropType<string>,
		buffer           : Number as PropType<number>,
		tolerance        : Number as PropType<number>,
		cluster          : [ Number, Boolean ] as PropType<number | boolean>,
		clusterRadius    : Number as PropType<number>,
		clusterMaxZoom   : Number as PropType<number>,
		clusterMinPoints : Number as PropType<number>,
		clusterProperties: Object as PropType<object>,
		lineMetrics      : Boolean as PropType<boolean>,
		generateId       : Boolean as PropType<boolean>,
		promoteId        : [ Object, String ] as PropType<PromoteIdSpecification>,
		filter           : [ Array, String, Object ] as PropType<any>
	},
	slots: Object as SlotsType<{ default: {} }>,
	setup(props, { slots }) {

		const cid      = inject(componentIdSymbol)!,
			  source   = SourceLib.getSourceRef<GeoJSONSource>(cid, props.sourceId),
			  registry = new SourceLayerRegistry();

		provide(sourceIdSymbol, props.sourceId);
		provide(sourceLayerRegistry, registry);

		useSource<GeoJSONSourceOptions>(source, props, 'geojson', sourceOpts, registry);

		watch(() => props.data, v => {
			console.log('GEOJSON SOURCE', source, props.data);
			source.value?.setData(v || { type: 'FeatureCollection', features: [] });
		}, { immediate: true });

		return () => [
			createCommentVNode('GeoJSON Source'),
			source.value && slots.default ? slots.default({}) : undefined
		];

	}
});
