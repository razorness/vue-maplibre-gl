<template>
	<!-- style-level setting: no DOM -->
</template>

<script setup lang="ts">
import type { LightSpecification } from 'maplibre-gl';
import { toRef, type PropType } from 'vue';
import { useStyleSetting } from 'composable/useStyleSetting';

defineOptions({ name: 'MglLight' });

const props = defineProps({
	/** The maplibre light specification (`anchor`, `position`, `color`, `intensity`). */
	light: { type: Object as PropType<LightSpecification>, required: true }
});

useStyleSetting<LightSpecification>({
	value: toRef(props, 'light'),
	apply: (map, light) => map.setLight(light)
});
</script>
