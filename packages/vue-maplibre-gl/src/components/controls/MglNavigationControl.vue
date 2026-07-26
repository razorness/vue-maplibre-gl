<template>
	<!-- wraps a native maplibre control: no DOM of its own -->
</template>

<script setup lang="ts">
import { NavigationControl } from 'maplibre-gl';
import { inject, type PropType } from 'vue';
import { Position, positionProp } from 'components/controls/position.enum';
import { usePositionWatcher } from 'composable/usePositionWatcher';
import { mapSymbol } from 'types';

defineOptions({ name: 'MglNavigationControl' });

const props = defineProps({
	/** Corner of the map the control is placed in. Adding, moving and removing is owned centrally, not by the component. */
	position: positionProp(Position.TOP_RIGHT),
	/** Show the compass button, which resets the bearing. */
	showCompass: { type: Boolean, default: true },
	/** Show the zoom in and zoom out buttons. */
	showZoom: { type: Boolean, default: true },
	/** Tilt the compass needle to visualise the current pitch. */
	visualizePitch: Boolean as PropType<boolean>
});

const map = inject(mapSymbol)!,
	control = new NavigationControl({
		showCompass: props.showCompass,
		showZoom: props.showZoom,
		visualizePitch: props.visualizePitch
	});

usePositionWatcher(() => props.position, map, control);
</script>
