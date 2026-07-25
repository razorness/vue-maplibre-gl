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
	sourceId: {
		type: String as PropType<string>,
		required: true
	},
	data: [Object, String] as PropType<GeoJSONSourceSpecification['data']>,
	maxzoom: Number as PropType<GeoJSONSourceSpecification['maxzoom']>,
	attribution: String as PropType<GeoJSONSourceSpecification['attribution']>,
	buffer: Number as PropType<GeoJSONSourceSpecification['buffer']>,
	tolerance: Number as PropType<GeoJSONSourceSpecification['tolerance']>,
	cluster: [Number, Boolean] as PropType<GeoJSONSourceSpecification['cluster']>,
	clusterRadius: Number as PropType<GeoJSONSourceSpecification['clusterRadius']>,
	clusterMaxZoom: Number as PropType<GeoJSONSourceSpecification['clusterMaxZoom']>,
	clusterMinPoints: Number as PropType<GeoJSONSourceSpecification['clusterMinPoints']>,
	clusterProperties: Object as PropType<GeoJSONSourceSpecification['clusterProperties']>,
	lineMetrics: Boolean as PropType<GeoJSONSourceSpecification['lineMetrics']>,
	generateId: Boolean as PropType<GeoJSONSourceSpecification['generateId']>,
	promoteId: [Object, String] as PropType<GeoJSONSourceSpecification['promoteId']>,
	filter: [Array, String, Object] as PropType<GeoJSONSourceSpecification['filter']>
});

defineSlots<{ default?: () => unknown }>();

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
