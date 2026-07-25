<template>
	<!-- a layer has no DOM of its own -->
</template>

<script setup lang="ts" generic="T extends MglLayerKind">
import type { Source } from 'maplibre-gl';
import { getCurrentInstance } from 'vue';
import { useLayer } from 'composable/useLayer';
import type { MglLayerEmits } from 'lib/layer.lib';
import type { MglLayerKind, MglLayerOptions } from 'types';

/**
 * Generic layer component. One implementation for every maplibre layer kind, `color-relief` included;
 * `options` is narrowed by `type`, so `paint` and `layout` autocomplete per kind and a `filter` on a
 * `background` layer is a type error.
 *
 * Deliberately thin: all behaviour lives in `useLayer()`, which is exported, so a project can build its
 * own layer component without reimplementing the lifecycle. The named wrappers (`MglFillLayer`,
 * `MglCircleLayer`, …) go through this component.
 */
const props = defineProps<{
	/** Layer id on the map. */
	layerId: string;
	/** Layer kind. Discriminates `options`. */
	type: T;
	/**
	 * The maplibre layer specification minus `id`, `type` and `source`.
	 * Applied incrementally on change — see `lib/layerDiff.ts`.
	 */
	options?: MglLayerOptions<T>;
	/**
	 * Source id, or a maplibre `Source` instance. Optional inside a `<MglSource>`, which provides it.
	 * Only a string id participates in source-readiness tracking.
	 */
	source?: string | Source;
	/** Insert the layer before this one. */
	before?: string;
}>();

/*
 * maplibre needs `(event, layerId, handler)`, which Vue's emit system cannot express, so the handlers are
 * read off the vnode props by `LayerLib` — that is what `instance` below is for. Declaring them here is
 * purely what gives consumers the typed `@click` / `@mouseenter` surface; nothing goes through `emit()`.
 */
defineEmits<MglLayerEmits>();

const { isAdded, add, remove } = useLayer({
	layerId: props.layerId,
	type: props.type,
	options: () => props.options,
	source: props.source,
	before: () => props.before,
	instance: getCurrentInstance()
});

defineExpose({ isAdded, add, remove });
</script>
