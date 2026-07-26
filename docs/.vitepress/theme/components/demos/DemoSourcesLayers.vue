<template>
	<div class="demo">
		<div class="demo-bar">
			<label>
				Radius
				<input v-model.number="radius" type="range" min="3" max="24" />
			</label>
			<label>
				Colour
				<input v-model="color" type="color" />
			</label>
			<button type="button" @click="shuffle">Move the points</button>
		</div>
		<ClientOnly>
			<MglMap :map-style="demoStyle" :center="[7.1, 50.7]" :zoom="4" class="demo-map" style="height: 340px">
				<MglNavigationControl position="top-right" />
				<MglGeoJsonSource source-id="demo-points" :options="{ data }">
					<MglCircleLayer
						layer-id="demo-circles"
						:paint="{ 'circle-radius': radius, 'circle-color': color, 'circle-stroke-width': 1, 'circle-stroke-color': '#fff' }"
						@mouseenter="hovered = true"
						@mouseleave="hovered = false"
						@click="onClick"
					/>
				</MglGeoJsonSource>
			</MglMap>
		</ClientOnly>
		<p class="demo-status">
			<span>{{ hovered ? 'pointer is over a circle' : 'hover a circle' }}</span>
			<span v-if="clicked">· clicked {{ clicked }}</span>
		</p>
	</div>
</template>

<script setup lang="ts">
import type { MapLayerMouseEvent } from 'maplibre-gl';
import { ref } from 'vue';
import { MglCircleLayer, MglGeoJsonSource, MglMap, MglNavigationControl } from 'vue-maplibre-gl';
import { demoStyle } from './mapStyle';

/*
 * Everything here is reactive on purpose: `radius` and `color` go through `setPaintProperty` per
 * property, and replacing `data` goes through `setData` — neither recreates the layer or the source.
 */
const radius = ref(9);
const color = ref('#2f7fd8');
const hovered = ref(false);
const clicked = ref('');

const cities = [
	['Bonn', 7.1, 50.73],
	['Berlin', 13.4, 52.52],
	['Paris', 2.35, 48.86],
	['Madrid', -3.7, 40.42],
	['Rome', 12.5, 41.9]
] as const;

const makeData = (jitter = 0) => ({
	type: 'FeatureCollection' as const,
	features: cities.map(([name, lng, lat]) => ({
		type: 'Feature' as const,
		properties: { name },
		geometry: {
			type: 'Point' as const,
			coordinates: [lng + (Math.random() - 0.5) * jitter, lat + (Math.random() - 0.5) * jitter]
		}
	}))
});

const data = ref(makeData());

const shuffle = () => (data.value = makeData(6));

function onClick(event: MapLayerMouseEvent) {
	clicked.value = String(event.features?.[0]?.properties?.name ?? '');
}
</script>
