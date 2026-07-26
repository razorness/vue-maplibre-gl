<template>
	<div class="mgl-container" :style="{ height, width }">
		<div ref="container" class="mgl-wrapper" />
		<!-- children may assume `map.value` exists, hence the gate -->
		<slot v-if="isInitialized" />
	</div>
</template>

<script setup lang="ts">
import type { MapEventType } from 'maplibre-gl';
import { computed, getCurrentInstance, useTemplateRef } from 'vue';
import { mapProps } from 'components/mapProps';
import { useCameraModel, type MglCameraEmits } from 'composable/useCameraModel';
import { useMglMap, type MglMapOptions } from 'composable/useMglMap';
import { MapLib, type MglMapEmits } from 'lib/map.lib';

defineOptions({ name: 'MglMap' });

/*
 * `props` is an imported *runtime* declaration on purpose: the prop set has to stay a single value so
 * `mapProps.ts` can assert with `AssertNever` that it covers every maplibre `MapOptions` key.
 *
 * `emits` is the opposite — a *type*, so handlers get a real `MglEvent<…>` payload instead of the `any`
 * the previous runtime array produced. Both interfaces are spelled out and guarded by `AssertNever`
 * pairs of their own, so neither can drift from maplibre.
 */
const props = defineProps(mapProps);
const emit = defineEmits<MglMapEmits & MglCameraEmits>();

defineSlots<{
	/** Rendered only once the map object exists, so children can assume `map.value` is set. */
	default?: () => unknown;
}>();

const instance = getCurrentInstance()!,
	container = useTemplateRef<HTMLDivElement>('container');

/**
 * Flat props collapsed into the maplibre options object `useMglMap` takes.
 *
 * `MAP_OPTION_KEYS` is the exhaustive, compile-time-checked list (see `lib/map.lib.ts`), and `mapStyle`
 * is renamed to maplibre's `style` — `style` as a prop name would collide with the DOM attribute.
 */
const options = computed<MglMapOptions>(() => {
	const result: Record<string, unknown> = {};
	for (const key of MapLib.MAP_OPTION_KEYS as readonly string[]) {
		const value = (props as Record<string, unknown>)[key];
		if (value !== undefined) {
			result[key === 'mapStyle' ? 'style' : key] = value;
		}
	}
	return result as MglMapOptions;
});

/** Only bind maplibre listeners for events the consumer actually bound, so unused events cost nothing. */
const boundEvents = computed<Array<keyof MapEventType>>(() =>
	MapLib.MAP_EVENT_TYPES.filter(event => Boolean(instance.vnode.props?.[`onMap:${event}`]))
);

const camera = useCameraModel(
	(event, value) => emit(event as never, value as never),
	event => Boolean(instance.vnode.props?.[`on${event.charAt(0).toUpperCase()}${event.slice(1)}`])
);

const { map, isInitialized, isLoaded, restart, dispose } = useMglMap({
	container,
	options,
	mapKey: props.mapKey,
	language: () => props.language,
	fitBoundsOptions: () => props.fitBoundsOptions,
	projection: () => props.projection,
	events: boundEvents.value,
	onEvent: (event, payload) => emit(`map:${event}` as never, payload as never),
	camera
});

defineExpose({ map, isInitialized, isLoaded, restart, dispose });
</script>
