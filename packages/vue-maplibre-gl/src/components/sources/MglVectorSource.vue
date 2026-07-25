<template>
	<MglSource :source-id="sourceId" type="vector" :options="options">
		<slot />
	</MglSource>
</template>

<script setup lang="ts">
import type { VectorSourceSpecification } from 'maplibre-gl';
import { computed, type PropType } from 'vue';
import MglSource from 'components/MglSource.vue';
import type { MglSourceOptions } from 'types';

/**
 * Named shim over the generic `<MglSource type="vector">`.
 *
 * Kept so existing templates keep working. New code should prefer
 * `<MglSource type="vector" :options="…">`, or `useSource()` for full control.
 *
 * The per-option `watch(… setData/setTiles/setUrl/setCoordinates …)` calls this component used to carry
 * are gone: `useSource` diffs the whole `options` object and picks the narrowest maplibre setter for
 * whatever actually changed, which also covers the options that never had a watcher.
 */
defineOptions({ name: 'MglVectorSource' });

const props = defineProps({
	sourceId: {
		type: String as PropType<string>,
		required: true
	},
	url: String as PropType<VectorSourceSpecification['url']>,
	tiles: Array as PropType<VectorSourceSpecification['tiles']>,
	bounds: Array as unknown as PropType<VectorSourceSpecification['bounds']>,
	scheme: String as PropType<VectorSourceSpecification['scheme']>,
	minzoom: Number as PropType<VectorSourceSpecification['minzoom']>,
	maxzoom: Number as PropType<VectorSourceSpecification['maxzoom']>,
	attribution: String as PropType<VectorSourceSpecification['attribution']>,
	promoteId: [Object, String] as PropType<VectorSourceSpecification['promoteId']>,
	volatile: Boolean as PropType<VectorSourceSpecification['volatile']>,
	encoding: String as PropType<VectorSourceSpecification['encoding']>
});

defineSlots<{ default?: () => unknown }>();

/*
 * Previously this file also carried a `keysOf<MglSourceOptions<'vector'>>({ … })` list purely to know
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
	return result as MglSourceOptions<'vector'>;
});
</script>
