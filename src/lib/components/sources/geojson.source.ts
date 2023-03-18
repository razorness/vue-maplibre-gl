import { createCommentVNode, defineComponent, inject, PropType, provide, toRef, watch } from 'vue';
import { componentIdSymbol, sourceIdSymbol, sourceLayerRegistry } from '@/lib/types';
import { GeoJSONSource, GeoJSONSourceOptions, PromoteIdSpecification } from 'maplibre-gl';
import { SourceLayerRegistry } from '@/lib/lib/sourceLayer.registry';
import GeoJSON from 'geojson';
import { SourceLib } from '@/lib/lib/source.lib';
import { useSource } from '@/lib/composable/useSource';

const sourceOpts: Array<keyof GeoJSONSourceOptions> = [
	'data', 'maxzoom', 'attribution', 'buffer', 'tolerance', 'cluster', 'clusterRadius', 'clusterMaxZoom', 'clusterMinPoints', 'clusterProperties',
	'lineMetrics', 'generateId', 'promoteId', 'filter'
];

export default defineComponent({
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
	setup(props) {

		const cid      = inject(componentIdSymbol)!,
			  source   = SourceLib.getSourceRef<GeoJSONSource>(cid, props.sourceId),
			  registry = new SourceLayerRegistry();

		provide(sourceIdSymbol, props.sourceId);
		provide(sourceLayerRegistry, registry);

		useSource<GeoJSONSourceOptions>(source, props, 'geojson', sourceOpts, registry);

		watch(toRef(props, 'data'), v => source.value?.setData(v || { type: 'FeatureCollection', features: [] }));

		return { source };

	},
	render() {
		return [
			createCommentVNode('GeoJSON Source'),
			this.source && this.$slots.default ? this.$slots.default() : undefined
		];
	}
});
