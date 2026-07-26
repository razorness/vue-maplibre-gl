<template>
	<!-- wraps a native maplibre control: no DOM of its own -->
</template>

<script setup lang="ts">
import { TerrainControl, type TerrainSpecification } from 'maplibre-gl';
import { inject, type PropType } from 'vue';
import { Position, positionProp } from 'components/controls/position.enum';
import { usePositionWatcher } from 'composable/usePositionWatcher';
import { mapSymbol } from 'types';

/**
 * Button that toggles terrain on and off.
 *
 * For terrain that is simply always on, use `<MglTerrain>` — that is a style setting, not a control.
 */
defineOptions({ name: 'MglTerrainControl' });

const props = defineProps({
	/** Corner of the map the control is placed in. Adding, moving and removing is owned centrally, not by the component. */
	position: positionProp(Position.TOP_RIGHT),
	/** Id of a `raster-dem` source. */
	source: { type: String as PropType<string>, required: true },
	/** Vertical exaggeration applied when the user turns terrain on. */
	exaggeration: Number as PropType<number>
});

const map = inject(mapSymbol)!,
	/*
	 * maplibre reads these once in the constructor; there is no setter on the control, so changing them
	 * requires remounting (`<MglTerrainControl :key="source">`).
	 */
	control = new TerrainControl({ source: props.source, exaggeration: props.exaggeration } as TerrainSpecification);

usePositionWatcher(() => props.position, map, control);
</script>
