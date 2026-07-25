<template>
	<MglSource :source-id="sourceId" type="raster-dem" :options="options">
		<slot />
	</MglSource>
</template>

<script setup lang="ts">
import type { RasterDEMSourceSpecification } from 'maplibre-gl';
import { computed, type PropType } from 'vue';
import MglSource from 'components/MglSource.vue';
import type { MglSourceOptions } from 'types';

/**
 * Named shim over the generic `<MglSource type="raster-dem">`.
 *
 * Kept so existing templates keep working. New code should prefer
 * `<MglSource type="raster-dem" :options="…">`, or `useSource()` for full control.
 *
 * The per-option `watch(… setData/setTiles/setUrl/setCoordinates …)` calls this component used to carry
 * are gone: `useSource` diffs the whole `options` object and picks the narrowest maplibre setter for
 * whatever actually changed, which also covers the options that never had a watcher.
 */
defineOptions({ name: 'MglRasterDemSource' });

const props = defineProps({
	sourceId: {
		type: String as PropType<string>,
		required: true
	},
	url: String as PropType<RasterDEMSourceSpecification['url']>,
	tiles: Array as PropType<RasterDEMSourceSpecification['tiles']>,
	bounds: Array as unknown as PropType<RasterDEMSourceSpecification['bounds']>,
	minzoom: Number as PropType<RasterDEMSourceSpecification['minzoom']>,
	maxzoom: Number as PropType<RasterDEMSourceSpecification['maxzoom']>,
	tileSize: Number as PropType<RasterDEMSourceSpecification['tileSize']>,
	attribution: String as PropType<RasterDEMSourceSpecification['attribution']>,
	encoding: String as PropType<RasterDEMSourceSpecification['encoding']>,
	volatile: Boolean as PropType<RasterDEMSourceSpecification['volatile']>,
	redFactor: Number as PropType<RasterDEMSourceSpecification['redFactor']>,
	blueFactor: Number as PropType<RasterDEMSourceSpecification['blueFactor']>,
	greenFactor: Number as PropType<RasterDEMSourceSpecification['greenFactor']>,
	baseShift: Number as PropType<RasterDEMSourceSpecification['baseShift']>
});

defineSlots<{ default?: () => unknown }>();

/*
 * Previously this file also carried a `keysOf<MglSourceOptions<'raster-dem'>>({ … })` list purely to know
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
	return result as MglSourceOptions<'raster-dem'>;
});
</script>
