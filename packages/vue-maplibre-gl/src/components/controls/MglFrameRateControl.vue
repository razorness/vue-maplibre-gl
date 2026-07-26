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
	/** Corner of the map the control is placed in. Adding, moving and removing is owned centrally, not by the component. */
	position: positionProp(Position.TOP_RIGHT),
	/** Background colour of the control. */
	background: String as PropType<string>,
	/** Width of one frame-time bar in pixels. */
	barWidth: Number as PropType<number>,
	/** Colour of the bars. */
	color: String as PropType<string>,
	/** CSS font used for the numeric readout. */
	font: String as PropType<string>,
	/** Height of the graph area in pixels. */
	graphHeight: Number as PropType<number>,
	/** Width of the graph area in pixels. */
	graphWidth: Number as PropType<number>,
	/** Top offset of the graph inside the control. */
	graphTop: Number as PropType<number>,
	/** Right offset of the graph inside the control. */
	graphRight: Number as PropType<number>,
	/** Width of the control in pixels. */
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
