<template>
	<!-- wraps a native maplibre control: no DOM of its own -->
</template>

<script setup lang="ts">
import { GeolocateControl, type FitBoundsOptions } from 'maplibre-gl';
import { inject, type PropType } from 'vue';
import { GEOLOCATION_EVENTS, type MglGeolocationEmits } from 'components/controls/controlEvents';
import { Position, positionProp } from 'components/controls/position.enum';
import { usePositionWatcher } from 'composable/usePositionWatcher';
import { mapSymbol } from 'types';

defineOptions({ name: 'MglGeolocationControl' });

const props = defineProps({
	position: positionProp(Position.TOP_RIGHT),
	/* object defaults must be factories, or every instance shares one object */
	positionOptions: {
		type: Object as PropType<PositionOptions>,
		default: () => ({ enableHighAccuracy: false, timeout: 6000 })
	},
	fitBoundsOptions: {
		type: Object as PropType<FitBoundsOptions>,
		default: () => ({ maxZoom: 15 })
	},
	trackUserLocation: { type: Boolean, default: false },
	showAccuracyCircle: { type: Boolean, default: true },
	showUserLocation: { type: Boolean, default: true }
});

/** v6's typed event map, surfaced as component emits. See `controlEvents.ts`. */
const emit = defineEmits<MglGeolocationEmits>();

const map = inject(mapSymbol)!,
	control = new GeolocateControl({
		positionOptions: props.positionOptions,
		fitBoundsOptions: props.fitBoundsOptions,
		trackUserLocation: props.trackUserLocation,
		showAccuracyCircle: props.showAccuracyCircle,
		showUserLocation: props.showUserLocation
	});

/*
 * Cast at the loop boundary: `event` is a union here, so maplibre's per-event listener type and
 * Vue's per-event emit signature cannot both narrow. Completeness is guaranteed by the
 * `AssertNever` pairs on MglGeolocationEmits instead.
 */
for (const event of GEOLOCATION_EVENTS) {
	control.on(event as never, ((ev: never) => (emit as (e: string, p: unknown) => void)(event, ev)) as never);
}

usePositionWatcher(() => props.position, map, control);
</script>
