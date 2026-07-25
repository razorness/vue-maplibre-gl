<template>
	<!-- style-level setting: no DOM -->
</template>

<script setup lang="ts">
import type { ProjectionSpecification } from 'maplibre-gl';
import { computed, type PropType } from 'vue';
import { useStyleSetting } from 'composable/useStyleSetting';

defineOptions({ name: 'MglProjection' });

const props = defineProps({
	/** `'globe'` | `'mercator'` | `'vertical-perspective'`, or an interpolating expression. */
	type: { type: [String, Array] as unknown as PropType<ProjectionSpecification['type']>, required: true }
});

useStyleSetting<ProjectionSpecification>({
	value: computed(() => ({ type: props.type })),
	apply: (map, projection) => map.setProjection(projection)
});
</script>
