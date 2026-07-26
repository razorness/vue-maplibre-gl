<template>
	<div class="demo">
		<ClientOnly>
			<MglMap :map-style="demoStyle" :center="[7.1, 50.7]" :zoom="5" class="demo-map" style="height: 320px">
				<!-- a marker with its own markup, and a popup nested inside it -->
				<MglMarker v-model:coordinates="dragged" :options="{ draggable: true }">
					<div class="demo-pin">⚑</div>
					<template #popup>
						<strong>Drag me</strong>
						<br />
						<code>{{ readable }}</code>
					</template>
				</MglMarker>

				<!-- the default maplibre marker, with a standalone popup -->
				<MglMarker :coordinates="[13.4, 52.52]" :options="{ color: '#c0392b' }" />
				<MglPopup :coordinates="[13.4, 52.52]" :offset="[0, -32]">Berlin</MglPopup>
			</MglMap>
		</ClientOnly>
		<p class="demo-status">The pin's popup is nested, so the marker toggles it. Berlin's popup stands alone and is always open.</p>
	</div>
</template>

<script setup lang="ts">
import type { LngLatLike } from 'maplibre-gl';
import { computed, ref } from 'vue';
import { MglMap, MglMarker, MglPopup } from 'vue-maplibre-gl';
import { demoStyle } from './mapStyle';

const dragged = ref<LngLatLike>([7.1, 50.7]);

const readable = computed(() => {
	const value = dragged.value as { lng?: number; lat?: number } | [number, number];
	const [lng, lat] = Array.isArray(value) ? value : [value.lng ?? 0, value.lat ?? 0];
	return `${lng.toFixed(3)}, ${lat.toFixed(3)}`;
});
</script>
