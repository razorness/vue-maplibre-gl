<template>
	<!--
		A custom marker needs its own DOM before maplibre can adopt it, so the slot renders into a detached
		element that is handed to the Marker as its `element`. Without a slot maplibre draws its default pin
		and nothing is rendered here. A nested <MglPopup> attaches itself to this marker.
	-->
	<Teleport v-if="element" :to="element">
		<slot />
	</Teleport>
	<slot name="popup" />
</template>

<script setup lang="ts">
import type { LngLatLike, Marker, PointLike, PositionAnchor } from 'maplibre-gl';
import { computed, type PropType } from 'vue';
import { useMarker } from 'composable/useMarker';

defineOptions({ name: 'MglMarker' });

const props = defineProps({
	/** Where the marker sits. Two-way bindable with `v-model:coordinates`, which follows a drag. */
	coordinates: { type: [Object, Array] as unknown as PropType<LngLatLike>, required: true },
	/** Pixel offset from the coordinate, as `[x, y]` or a `Point`. */
	offset: [Object, Array] as PropType<PointLike>,
	/** Which part of the marker sits on the coordinate, e.g. `'bottom'` for a pin. */
	anchor: String as PropType<PositionAnchor>,
	/** Fill colour of the default marker. Ignored once you pass your own markup through the default slot. */
	color: String as PropType<string>,
	/** Let the user drag the marker. Pair it with `v-model:coordinates` or the `dragend` event. */
	draggable: Boolean as PropType<boolean>,
	/** Pointer movement in pixels that still counts as a click rather than a drag. */
	clickTolerance: Number as PropType<number>,
	/** Rotation in degrees clockwise. */
	rotation: Number as PropType<number>,
	/** Whether `rotation` is relative to the `map` or the `viewport`. */
	rotationAlignment: String as PropType<'map' | 'viewport' | 'auto'>,
	/** Whether the marker tilts with the `map` or stays flat against the `viewport`. */
	pitchAlignment: String as PropType<'map' | 'viewport' | 'auto'>,
	/** Scale factor of the default marker. */
	scale: Number as PropType<number>,
	/** Extra CSS class on the marker element. */
	className: String as PropType<string>,
	/** Opacity while the marker is visible. */
	opacity: String as PropType<string>,
	/** Opacity while the marker is hidden behind terrain. */
	opacityWhenCovered: String as PropType<string>,
	/** Position on fractional pixels. Smoother while animating, slightly blurrier at rest. */
	subpixelPositioning: Boolean as PropType<boolean>
});

const emit = defineEmits<{
	/** Emitted on `dragend` only, not on every drag frame — see `useMarker`. */
	'update:coordinates': [value: LngLatLike];
	dragstart: [marker: Marker];
	drag: [marker: Marker];
	dragend: [marker: Marker];
	click: [marker: Marker];
}>();

const slots = defineSlots<{
	/** Custom marker content. Omit it to get maplibre's default pin. */
	default?: () => unknown;
	/** For a nested `<MglPopup>`; it attaches to this marker rather than to the map. */
	popup?: () => unknown;
}>();

/* only created when a slot is present, so the default pin still works */
const element = slots.default ? document.createElement('div') : undefined;

const options = computed(() => ({
	offset: props.offset,
	anchor: props.anchor,
	color: props.color,
	draggable: props.draggable,
	clickTolerance: props.clickTolerance,
	rotation: props.rotation,
	rotationAlignment: props.rotationAlignment,
	pitchAlignment: props.pitchAlignment,
	scale: props.scale,
	className: props.className,
	opacity: props.opacity,
	opacityWhenCovered: props.opacityWhenCovered,
	subpixelPositioning: props.subpixelPositioning
}));

const { marker } = useMarker({
	lngLat: () => props.coordinates,
	options,
	element,
	onDragStart: m => emit('dragstart', m),
	onDrag: m => emit('drag', m),
	onDragEnd: m => {
		emit('dragend', m);
		emit('update:coordinates', m.getLngLat());
	},
	onClick: m => emit('click', m)
});

defineExpose({ marker });
</script>
