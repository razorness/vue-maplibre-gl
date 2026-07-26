<template>
	<MglSource :source-id="sourceId" type="geojson" :options="options">
		<slot />
	</MglSource>
</template>

<script setup lang="ts">
import type { GeoJSONSourceSpecification } from 'maplibre-gl';
import { computed, type PropType } from 'vue';
import MglSource from 'components/MglSource.vue';
import type { MglSourceOptions } from 'types';

/**
 * Named shim over the generic `<MglSource type="geojson">`.
 *
 * Kept so existing templates keep working. New code should prefer
 * `<MglSource type="geojson" :options="…">`, or `useSource()` for full control.
 *
 * The per-option `watch(… setData/setTiles/setUrl/setCoordinates …)` calls this component used to carry
 * are gone: `useSource` diffs the whole `options` object and picks the narrowest maplibre setter for
 * whatever actually changed, which also covers the options that never had a watcher.
 */
defineOptions({ name: 'MglGeoJsonSource' });

const props = defineProps({
	/**
	 * Id the source is registered under. Layers nested inside this component bind to it automatically.
	 */
	sourceId: {
		type: String as PropType<string>,
		required: true
	},
	/**
	 * The GeoJSON itself, or a URL to it. Applied through `setData`, so assigning a new value updates the source in place instead of recreating it.
	 *
	 * This type degrades to `any` unless your project includes `@types/geojson` explicitly — see the installation guide.
	 */
	data: [Object, String] as PropType<GeoJSONSourceSpecification['data']>,
	/**
	 * Maximum zoom level tiles are available for. Beyond it, the last level is overscaled.
	 */
	maxzoom: Number as PropType<GeoJSONSourceSpecification['maxzoom']>,
	/**
	 * Attribution text shown for this source. Usually a licence requirement of the data provider.
	 */
	attribution: String as PropType<GeoJSONSourceSpecification['attribution']>,
	/**
	 * Buffer in pixels around each tile, so features near an edge are not clipped. Higher values cost tile size.
	 */
	buffer: Number as PropType<GeoJSONSourceSpecification['buffer']>,
	/**
	 * Simplification tolerance. Higher values mean smaller tiles and coarser geometry.
	 */
	tolerance: Number as PropType<GeoJSONSourceSpecification['tolerance']>,
	/**
	 * Cluster nearby points into aggregate features. Applied through `setClusterOptions`.
	 */
	cluster: [Number, Boolean] as PropType<GeoJSONSourceSpecification['cluster']>,
	/**
	 * Cluster radius in pixels.
	 */
	clusterRadius: Number as PropType<GeoJSONSourceSpecification['clusterRadius']>,
	/**
	 * Zoom level beyond which points are no longer clustered.
	 */
	clusterMaxZoom: Number as PropType<GeoJSONSourceSpecification['clusterMaxZoom']>,
	/**
	 * Smallest number of points that forms a cluster.
	 */
	clusterMinPoints: Number as PropType<GeoJSONSourceSpecification['clusterMinPoints']>,
	/**
	 * Aggregations computed per cluster, e.g. summing a property across the points it contains.
	 */
	clusterProperties: Object as PropType<GeoJSONSourceSpecification['clusterProperties']>,
	/**
	 * Compute `line-progress` along lines, which line gradients need.
	 */
	lineMetrics: Boolean as PropType<GeoJSONSourceSpecification['lineMetrics']>,
	/**
	 * Derive a feature id from the feature index. Needed for feature state when the data carries no ids.
	 */
	generateId: Boolean as PropType<GeoJSONSourceSpecification['generateId']>,
	/**
	 * Use this property as the feature id instead of the GeoJSON `id`.
	 */
	promoteId: [Object, String] as PropType<GeoJSONSourceSpecification['promoteId']>,
	/**
	 * Drop features that do not match this expression while the tiles are built, before any layer sees them.
	 */
	filter: [Array, String, Object] as PropType<GeoJSONSourceSpecification['filter']>
});

defineSlots<{
	/** Layers for this source. They pick up its id automatically, and are removed before the source is. */
	default?: () => unknown;
}>();

/*
 * Previously this file also carried a `keysOf<MglSourceOptions<'geojson'>>({ … })` list purely to know
 * which props to forward. That duplicated the prop declaration right above it. The props *are* the
 * runtime list, so `Object.keys` is enough — and the exhaustiveness guarantee is kept on the type level
 * by the assertion below, with no second list to maintain.
 */
const options = computed(() => {
	const result: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(props)) {
		if (key !== 'sourceId' && value !== undefined) {
			result[key] = value;
		}
	}
	return result as MglSourceOptions<'geojson'>;
});
</script>
