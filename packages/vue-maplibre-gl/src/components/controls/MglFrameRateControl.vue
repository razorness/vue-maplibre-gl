<template>
	<!-- wraps a native maplibre control: no DOM of its own -->
</template>

<script setup lang="ts">
import { inject, type PropType } from 'vue';
import { FrameRateControl } from 'components/controls/frameRateControl';
import { Position, positionProp } from 'components/controls/position.enum';
import { usePositionWatcher } from 'composable/usePositionWatcher';
import { mapSymbol } from 'types';

defineOptions({ name: 'MglFrameRateControl' });

/*
 * No `window.devicePixelRatio` in the prop defaults, even though that is where it naturally belongs.
 *
 * A prop default is evaluated when the *module* is evaluated, not when the component mounts — so having it
 * here made the whole package unimportable server-side (`ReferenceError: window is not defined`), since the
 * component barrel pulls this module in. Vue only treats a `default` as a factory for object and array
 * types, so there is no lazy form available for a number.
 *
 * The props are left undefined instead, and `FrameRateControl` applies exactly the same defaults in its
 * constructor — which only ever runs in a browser.
 */
const props = defineProps({
	position: positionProp(Position.TOP_RIGHT),
	background: String as PropType<string>,
	barWidth: Number as PropType<number>,
	color: String as PropType<string>,
	font: String as PropType<string>,
	graphHeight: Number as PropType<number>,
	graphWidth: Number as PropType<number>,
	graphTop: Number as PropType<number>,
	graphRight: Number as PropType<number>,
	width: Number as PropType<number>
});

const map = inject(mapSymbol)!,
	control = new FrameRateControl({
		background: props.background,
		barWidth: props.barWidth,
		color: props.color,
		font: props.font,
		graphHeight: props.graphHeight,
		graphWidth: props.graphWidth,
		graphTop: props.graphTop,
		graphRight: props.graphRight,
		width: props.width
	});

usePositionWatcher(() => props.position, map, control);

defineExpose({ control });
</script>
