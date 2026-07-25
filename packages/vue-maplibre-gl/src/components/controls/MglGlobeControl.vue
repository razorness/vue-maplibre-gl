<template>
	<!-- wraps a native maplibre control: no DOM of its own -->
</template>

<script setup lang="ts">
import { GlobeControl } from 'maplibre-gl';
import { inject } from 'vue';
import { Position, positionProp } from 'components/controls/position.enum';
import { usePositionWatcher } from 'composable/usePositionWatcher';
import { mapSymbol } from 'types';

/** Toggles between the globe and mercator projections. New in maplibre v6. */
defineOptions({ name: 'MglGlobeControl' });

const props = defineProps({
	position: positionProp(Position.TOP_RIGHT)
});

const map = inject(mapSymbol)!,
	control = new GlobeControl();

usePositionWatcher(() => props.position, map, control);
</script>
