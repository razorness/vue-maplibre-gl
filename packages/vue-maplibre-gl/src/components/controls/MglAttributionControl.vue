<template>
	<!-- wraps a native maplibre control: no DOM of its own -->
</template>

<script setup lang="ts">
import { AttributionControl } from 'maplibre-gl';
import { inject, type PropType } from 'vue';
import { positionProp } from 'components/controls/position.enum';
import { usePositionWatcher } from 'composable/usePositionWatcher';
import { mapSymbol } from 'types';

defineOptions({ name: 'MglAttributionControl' });

const props = defineProps({
	/** Corner of the map the control is placed in. Adding, moving and removing is owned centrally, not by the component. */
	position: positionProp(),
	/** Collapse into a small button that expands on click. Chosen automatically when unset. */
	compact: Boolean as PropType<boolean>,
	/** Extra attribution shown alongside what the sources declare. */
	customAttribution: [String, Array] as PropType<string | string[]>
});

const map = inject(mapSymbol)!,
	control = new AttributionControl({ compact: props.compact, customAttribution: props.customAttribution });

usePositionWatcher(() => props.position, map, control);
</script>
