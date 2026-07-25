<template>
	<!-- wraps a native maplibre control: no DOM of its own -->
</template>

<script setup lang="ts">
import { ScaleControl } from 'maplibre-gl';
import { inject, type PropType } from 'vue';
import { positionProp } from 'components/controls/position.enum';
import { ScaleControlUnit, ScaleControlUnitValues } from 'components/controls/scaleControlUnit';
import { usePositionWatcher } from 'composable/usePositionWatcher';
import { mapSymbol } from 'types';

defineOptions({ name: 'MglScaleControl' });

const props = defineProps({
	position: positionProp(),
	maxWidth: { type: Number as PropType<number>, default: 100 },
	unit: {
		type: String as unknown as () => ScaleControlUnit,
		default: ScaleControlUnit.METRIC,
		validator: (v: unknown) => ScaleControlUnitValues.includes(v as ScaleControlUnit)
	}
});

const map = inject(mapSymbol)!,
	control = new ScaleControl({ maxWidth: props.maxWidth, unit: props.unit });

usePositionWatcher(() => props.position, map, control);
</script>
