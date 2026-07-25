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
	position: positionProp(Position.TOP_RIGHT),
	showCompass: { type: Boolean, default: true },
	showZoom: { type: Boolean, default: true },
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
