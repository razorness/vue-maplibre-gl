<template>
	<MglSource :source-id="sourceId" type="raster" :options="options">
		<slot />
	</MglSource>
</template>

<script setup lang="ts">
import type { RasterSourceSpecification } from 'maplibre-gl';
import { computed, type PropType } from 'vue';
import MglSource from 'components/MglSource.vue';
import type { MglSourceOptions } from 'types';

/**
 * Named shim over the generic `<MglSource type="raster">`.
 *
 * Kept so existing templates keep working. New code should prefer
 * `<MglSource type="raster" :options="…">`, or `useSource()` for full control.
 *
 * The per-option `watch(… setData/setTiles/setUrl/setCoordinates …)` calls this component used to carry
 * are gone: `useSource` diffs the whole `options` object and picks the narrowest maplibre setter for
 * whatever actually changed, which also covers the options that never had a watcher.
 */
defineOptions({ name: 'MglRasterSource' });

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
	url: String as PropType<RasterSourceSpecification['url']>,
	/**
	 * Tile URL templates, e.g. `https://host/{z}/{x}/{y}.png`. Applied through `setTiles`.
	 */
	tiles: Array as PropType<RasterSourceSpecification['tiles']>,
	/**
	 * Bounds outside which no tiles are requested, as `[west, south, east, north]`.
	 */
	bounds: Array as unknown as PropType<RasterSourceSpecification['bounds']>,
	/**
	 * Minimum zoom level tiles are available for.
	 */
	minzoom: Number as PropType<RasterSourceSpecification['minzoom']>,
	/**
	 * Maximum zoom level tiles are available for. Beyond it, the last level is overscaled.
	 */
	maxzoom: Number as PropType<RasterSourceSpecification['maxzoom']>,
	/**
	 * Tile size in pixels this source serves.
	 */
	tileSize: Number as PropType<RasterSourceSpecification['tileSize']>,
	/**
	 * Tile coordinate scheme: `'xyz'` (the default) or `'tms'`, which flips the y axis.
	 */
	scheme: String as PropType<RasterSourceSpecification['scheme']>,
	/**
	 * Attribution text shown for this source. Usually a licence requirement of the data provider.
	 */
	attribution: String as PropType<RasterSourceSpecification['attribution']>,
	/**
	 * Never cache these tiles — for data that changes faster than the cache would allow.
	 */
	volatile: Boolean as PropType<RasterSourceSpecification['volatile']>
});

defineSlots<{
	/** Layers for this source. They pick up its id automatically, and are removed before the source is. */
	default?: () => unknown;
}>();

/*
 * Previously this file also carried a `keysOf<MglSourceOptions<'raster'>>({ … })` list purely to know
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
	return result as MglSourceOptions<'raster'>;
});
</script>
