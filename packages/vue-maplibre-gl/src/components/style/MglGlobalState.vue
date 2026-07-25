<template>
	<!-- style-level setting: no DOM -->
</template>

<script setup lang="ts">
import { toRef, type PropType } from 'vue';
import { useStyleSetting } from 'composable/useStyleSetting';

defineOptions({ name: 'MglGlobalState' });

const props = defineProps({
	/**
	 * Values for the style's global state, addressable from expressions via `['global-state', 'key']`.
	 * New in maplibre v6.
	 */
	state: { type: Object as PropType<Record<string, unknown>>, required: true }
});

useStyleSetting<Record<string, unknown>>({
	value: toRef(props, 'state'),
	apply: (map, state) => {
		for (const [key, value] of Object.entries(state)) {
			map.setGlobalStateProperty(key, value as never);
		}
	}
});
</script>
