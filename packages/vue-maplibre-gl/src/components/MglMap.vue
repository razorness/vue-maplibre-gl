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
import { CAMERA_MODEL_EMITS, useCameraModel } from 'composable/useCameraModel';
import { useMglMap, type MglMapOptions } from 'composable/useMglMap';
import { MapLib } from 'lib/map.lib';

defineOptions({ name: 'MglMap' });

/*
 * Props and emits are imported runtime declarations, not type-only ones. That is deliberate: the prop set
 * has to stay a single value so `mapProps.ts` can assert with `AssertNever` that it covers every maplibre
 * `MapOptions` key, and the emit list has to stay derived from `MapLib.MAP_EVENT_TYPES`. Vue's SFC
 * compiler passes a runtime declaration straight through; a type declaration could reference neither.
 */
const props = defineProps(mapProps);
const emit = defineEmits([...MapLib.MAP_EMIT_NAMES, ...CAMERA_MODEL_EMITS]);

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
