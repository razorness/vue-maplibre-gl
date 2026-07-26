<template>
	<div class="demo">
		<div class="demo-bar">
			<label>
				Zoom
				<input v-model.number="zoom" type="range" min="1" max="12" step="0.5" />
				<code>{{ zoom }}</code>
			</label>
			<label>
				Bearing
				<input v-model.number="bearing" type="range" min="-180" max="180" />
				<code>{{ Math.round(bearing) }}°</code>
			</label>
			<button type="button" @click="jump">Jump to Rome</button>
		</div>
		<ClientOnly>
			<MglMap
				v-model:center="center"
				v-model:zoom="zoom"
				v-model:bearing="bearing"
				:map-style="demoStyle"
				class="demo-map"
				style="height: 320px"
			/>
		</ClientOnly>
		<p class="demo-status">
			centre <code>{{ readable }}</code> — drag the map and the sliders follow
		</p>
	</div>
</template>

<script setup lang="ts">
import type { LngLatLike } from 'maplibre-gl';
import { computed, ref } from 'vue';
import { MglMap } from 'vue-maplibre-gl';
import { demoStyle } from './mapStyle';

/*
 * All three bindings go both ways. Note what the readout shows while dragging: `zoom` only updates when
 * the movement settles, because the binding listens on `zoomend` rather than on `zoom` — and the value
 * comes back snapped to a whole number, which is why the loop guard cannot compare values.
 */
const center = ref<LngLatLike>([7.1, 50.7]);
const zoom = ref(4);
const bearing = ref(0);

const jump = () => {
	center.value = [12.5, 41.9];
	zoom.value = 6;
};

const readable = computed(() => {
	const value = center.value as { lng?: number; lat?: number } | [number, number];
	const [lng, lat] = Array.isArray(value) ? value : [value.lng ?? 0, value.lat ?? 0];
	return `${lng.toFixed(2)}, ${lat.toFixed(2)}`;
});
</script>
