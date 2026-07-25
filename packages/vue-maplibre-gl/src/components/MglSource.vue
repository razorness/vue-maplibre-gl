<template>
	<slot v-if="isReady" />
</template>

<script setup lang="ts" generic="T extends MglSourceKind">
import { useSource } from 'composable/useSource';
import type { MglSourceKind, MglSourceOptions } from 'types';

/**
 * Generic source component. One implementation for every maplibre source kind; `options` is narrowed by
 * `type`, so `<MglSource type="geojson" :options="{ tiles: [] }"/>` is a type error.
 *
 * Deliberately thin: all behaviour lives in `useSource()`, which is exported, so a project that needs
 * something this component does not offer can build its own component without reimplementing the source
 * lifecycle. The named wrappers (`MglGeoJsonSource`, …) go through this component.
 */
const props = defineProps<{
	/** Id the source is registered under. Layers in the default slot bind to it automatically. */
	sourceId: string;
	/** Source kind. Discriminates `options`. */
	type: T;
	/** The maplibre source specification minus `type`. Applied incrementally on change. */
	options: MglSourceOptions<T>;
}>();

defineSlots<{
	/** Rendered once the source is on the map, so nested layers can add themselves immediately. */
	default?: () => unknown;
}>();

const { source, isReady, recreate } = useSource({
	sourceId: props.sourceId,
	type: props.type,
	options: () => props.options
});

/** Exposed so a parent can reach the live maplibre source, e.g. for `getClusterExpansionZoom`. */
defineExpose({ source, isReady, recreate });
</script>
