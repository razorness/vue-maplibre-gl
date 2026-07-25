<template>
	<!-- maplibre owns the popup DOM, so the slot content is teleported into the node it was given -->
	<Teleport :to="element">
		<slot />
	</Teleport>
</template>

<script setup lang="ts">
import type { LngLatLike, Offset, PaddingOptions, PopupOptions, PositionAnchor } from 'maplibre-gl';
import { computed, type PropType } from 'vue';
import { usePopup } from 'composable/usePopup';

defineOptions({ name: 'MglPopup' });

const props = defineProps({
	/** Optional when nested in an `<MglMarker>` (the marker's position wins) or with `track-pointer`. */
	coordinates: [Object, Array] as unknown as PropType<LngLatLike>,
	closeButton: { type: Boolean, default: true },
	closeOnClick: { type: Boolean, default: true },
	closeOnMove: Boolean as PropType<boolean>,
	focusAfterOpen: { type: Boolean, default: true },
	anchor: String as PropType<PositionAnchor>,
	offset: [Number, Object, Array] as unknown as PropType<Offset>,
	className: String as PropType<string>,
	maxWidth: String as PropType<string>,
	subpixelPositioning: Boolean as PropType<boolean>,
	locationOccludedOpacity: [Number, String] as unknown as PropType<number | string>,
	/* maplibre's PopupOptions.padding is a PaddingOptions object, not a number */
	padding: Object as PropType<PaddingOptions>,
	/** Two-way: `v-model:open`. Leave unset for an always-open popup. */
	open: { type: Boolean, default: undefined },
	/** Follow the cursor instead of sticking to a coordinate. */
	trackPointer: Boolean as PropType<boolean>
});

const emit = defineEmits<{
	'update:open': [open: boolean];
	popupopen: [];
	popupclose: [];
}>();

defineSlots<{ default?: () => unknown }>();

/*
 * maplibre takes ownership of this node via `setDOMContent`, so it is created once and the slot is
 * teleported into it rather than the other way round.
 */
const element = document.createElement('div');

const options = computed<PopupOptions>(() => ({
	closeButton: props.closeButton,
	closeOnClick: props.closeOnClick,
	closeOnMove: props.closeOnMove,
	focusAfterOpen: props.focusAfterOpen,
	anchor: props.anchor,
	offset: props.offset,
	className: props.className,
	maxWidth: props.maxWidth,
	subpixelPositioning: props.subpixelPositioning,
	locationOccludedOpacity: props.locationOccludedOpacity as never,
	padding: props.padding
}));

const { popup, isOpen, open, close } = usePopup({
	lngLat: () => props.coordinates,
	options,
	element,
	open: () => props.open,
	trackPointer: () => props.trackPointer,
	/* maplibre can close the popup itself (close button, closeOnClick), so the model is kept in sync */
	onOpen: () => {
		emit('popupopen');
		emit('update:open', true);
	},
	onClose: () => {
		emit('popupclose');
		emit('update:open', false);
	}
});

defineExpose({ popup, isOpen, open, close });
</script>
