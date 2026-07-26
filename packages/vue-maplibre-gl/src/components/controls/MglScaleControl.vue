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
	/** Corner of the map the control is placed in. Adding, moving and removing is owned centrally, not by the component. */
	position: positionProp(),
	/** Maximum width of the scale bar in pixels. */
	maxWidth: { type: Number as PropType<number>, default: 100 },
	/** Unit system the distance is shown in. */
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
