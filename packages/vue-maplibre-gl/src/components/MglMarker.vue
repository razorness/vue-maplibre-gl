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
	coordinates: { type: [Object, Array] as unknown as PropType<LngLatLike>, required: true },
	offset: [Object, Array] as PropType<PointLike>,
	anchor: String as PropType<PositionAnchor>,
	color: String as PropType<string>,
	draggable: Boolean as PropType<boolean>,
	clickTolerance: Number as PropType<number>,
	rotation: Number as PropType<number>,
	rotationAlignment: String as PropType<'map' | 'viewport' | 'auto'>,
	pitchAlignment: String as PropType<'map' | 'viewport' | 'auto'>,
	scale: Number as PropType<number>,
	className: String as PropType<string>,
	opacity: String as PropType<string>,
	opacityWhenCovered: String as PropType<string>,
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
