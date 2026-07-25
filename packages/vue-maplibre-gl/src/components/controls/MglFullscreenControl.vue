<template>
	<!-- wraps a native maplibre control: no DOM of its own -->
</template>

<script setup lang="ts">
import { FullscreenControl } from 'maplibre-gl';
import { inject, nextTick, onBeforeUnmount, type PropType } from 'vue';
import { FULLSCREEN_EVENTS, type MglFullscreenEmits } from 'components/controls/controlEvents';
import { Position, positionProp } from 'components/controls/position.enum';
import { usePositionWatcher } from 'composable/usePositionWatcher';
import { mapSymbol } from 'types';

defineOptions({ name: 'MglFullscreenControl' });

const props = defineProps({
	position: positionProp(Position.TOP_RIGHT),
	container: { type: Object as PropType<HTMLElement>, default: null }
});

/** v6's typed event map, surfaced as component emits. See `controlEvents.ts`. */
const emit = defineEmits<MglFullscreenEmits>();

const map = inject(mapSymbol)!,
	control = new FullscreenControl({ container: props.container || undefined });

/* maplibre resizes on fullscreen change, but the canvas is laid out one tick later */
function triggerResize() {
	void nextTick(() => map.value?.resize());
}

/* cast at the loop boundary: see the note in MglGeolocationControl */
for (const event of FULLSCREEN_EVENTS) {
	control.on(
		event as never,
		((ev: never) => {
			triggerResize();
			(emit as (e: string, p: unknown) => void)(event, ev);
		}) as never
	);
}

usePositionWatcher(() => props.position, map, control);

// removeControl is owned by usePositionWatcher
onBeforeUnmount(() => {
	control.off('fullscreenstart', triggerResize);
	control.off('fullscreenend', triggerResize);
});
</script>
