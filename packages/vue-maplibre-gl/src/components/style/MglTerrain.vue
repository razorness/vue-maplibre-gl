<template>
	<!-- style-level setting: no DOM -->
</template>

<script setup lang="ts">
import type { TerrainSpecification } from 'maplibre-gl';
import { computed, type PropType } from 'vue';
import { useStyleSetting } from 'composable/useStyleSetting';

defineOptions({ name: 'MglTerrain' });

const props = defineProps({
	/** Id of a `raster-dem` source. */
	source: { type: String as PropType<string>, required: true },
	exaggeration: Number as PropType<number>
});

useStyleSetting<TerrainSpecification>({
	value: computed(() => ({ source: props.source, exaggeration: props.exaggeration })),
	apply: (map, terrain) => map.setTerrain(terrain),
	reset: map => map.setTerrain(null)
});
</script>
