<template>
	<!-- style-level setting: no DOM -->
</template>

<script setup lang="ts">
import type { SkySpecification } from 'maplibre-gl';
import { toRef, type PropType } from 'vue';
import { useStyleSetting } from 'composable/useStyleSetting';

defineOptions({ name: 'MglSky' });

const props = defineProps({
	/** The maplibre sky specification (`sky-color`, `horizon-blend`, `fog-color`, …). */
	sky: { type: Object as PropType<SkySpecification>, required: true }
});

useStyleSetting<SkySpecification>({
	value: toRef(props, 'sky'),
	/* no reset: maplibre's setSky takes no clearing value, so the sky stays until the style changes */
	apply: (map, sky) => map.setSky(sky)
});
</script>
