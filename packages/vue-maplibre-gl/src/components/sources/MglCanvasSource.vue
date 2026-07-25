<template>
	<MglSource :source-id="sourceId" type="canvas" :options="options">
		<slot />
	</MglSource>
</template>

<script setup lang="ts">
import type { CanvasSourceSpecification } from 'maplibre-gl';
import { computed, type PropType } from 'vue';
import MglSource from 'components/MglSource.vue';
import type { MglSourceOptions } from 'types';

/**
 * Named shim over the generic `<MglSource type="canvas">`.
 *
 * Kept so existing templates keep working. New code should prefer
 * `<MglSource type="canvas" :options="…">`, or `useSource()` for full control.
 *
 * The per-option `watch(… setData/setTiles/setUrl/setCoordinates …)` calls this component used to carry
 * are gone: `useSource` diffs the whole `options` object and picks the narrowest maplibre setter for
 * whatever actually changed, which also covers the options that never had a watcher.
 */
defineOptions({ name: 'MglCanvasSource' });

const props = defineProps({
	sourceId: {
		type: String as PropType<string>,
		required: true
	},
	coordinates: Array as unknown as PropType<CanvasSourceSpecification['coordinates']>,
	animate: Boolean as PropType<CanvasSourceSpecification['animate']>,
	canvas: [Object, String] as PropType<CanvasSourceSpecification['canvas']>
});

defineSlots<{ default?: () => unknown }>();

/*
 * Previously this file also carried a `keysOf<MglSourceOptions<'canvas'>>({ … })` list purely to know
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
	return result as MglSourceOptions<'canvas'>;
});
</script>
