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
	/**
	 * Id the source is registered under. Layers nested inside this component bind to it automatically.
	 */
	sourceId: {
		type: String as PropType<string>,
		required: true
	},
	/**
	 * URL of the resource. Applied through `setUrl` where maplibre supports it.
	 */
	url: String as PropType<RasterDEMSourceSpecification['url']>,
	/**
	 * Tile URL templates, e.g. `https://host/{z}/{x}/{y}.png`. Applied through `setTiles`.
	 */
	tiles: Array as PropType<RasterDEMSourceSpecification['tiles']>,
	/**
	 * Bounds outside which no tiles are requested, as `[west, south, east, north]`.
	 */
	bounds: Array as unknown as PropType<RasterDEMSourceSpecification['bounds']>,
	/**
	 * Minimum zoom level tiles are available for.
	 */
	minzoom: Number as PropType<RasterDEMSourceSpecification['minzoom']>,
	/**
	 * Maximum zoom level tiles are available for. Beyond it, the last level is overscaled.
	 */
	maxzoom: Number as PropType<RasterDEMSourceSpecification['maxzoom']>,
	/**
	 * Tile size in pixels this source serves.
	 */
	tileSize: Number as PropType<RasterDEMSourceSpecification['tileSize']>,
	/**
	 * Attribution text shown for this source. Usually a licence requirement of the data provider.
	 */
	attribution: String as PropType<RasterDEMSourceSpecification['attribution']>,
	/**
	 * How elevation is packed into the RGB channels: `'mapbox'`, `'terrarium'` or `'custom'`.
	 */
	encoding: String as PropType<RasterDEMSourceSpecification['encoding']>,
	/**
	 * Never cache these tiles — for data that changes faster than the cache would allow.
	 */
	volatile: Boolean as PropType<RasterDEMSourceSpecification['volatile']>,
	/**
	 * Multiplier for the red channel. Only used with `encoding: custom`.
	 */
	redFactor: Number as PropType<RasterDEMSourceSpecification['redFactor']>,
	/**
	 * Multiplier for the blue channel. Only used with `encoding: custom`.
	 */
	blueFactor: Number as PropType<RasterDEMSourceSpecification['blueFactor']>,
	/**
	 * Multiplier for the green channel. Only used with `encoding: custom`.
	 */
	greenFactor: Number as PropType<RasterDEMSourceSpecification['greenFactor']>,
	/**
	 * Offset applied to the decoded elevation. Only used with `encoding: custom`.
	 */
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
