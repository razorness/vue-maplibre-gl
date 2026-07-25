<template>
	<div>
		<h3>Composable-only map (no &lt;mgl-map&gt;)</h3>
		<div ref="container" style="width: 100%; height: 300px" />
		<p>loaded: {{ isLoaded }} · zoom: {{ zoom }}</p>
		<button type="button" @click="zoom = zoom === 2 ? 5 : 2">toggle zoom</button>
		<button type="button" @click="paintColor = paintColor === '#e55e5e' ? '#3bb2d0' : '#e55e5e'">toggle colour</button>
	</div>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import { useLayer, useMapEvent, useMglMap, useSource } from 'vue-maplibre-gl';

/*
 * Proves the composable path is a real alternative to <mgl-map>: this component owns its container and
 * template, calls useMglMap() for the lifecycle, and then uses useSource()/useLayer()/useMapEvent()
 * exactly as the components would.
 */
const container = useTemplateRef<HTMLDivElement>('container'),
	zoom = ref(2),
	paintColor = ref('#e55e5e');

const { isLoaded } = useMglMap({
	container,
	options: () => ({
		style: `https://api.maptiler.com/maps/streets/style.json?key=${import.meta.env.VITE_MAP_STYLE_KEY}`,
		center: [13.4, 52.52],
		zoom: zoom.value
	})
});

useSource({
	sourceId: 'composable-points',
	type: 'geojson',
	options: () => ({
		data: {
			type: 'FeatureCollection',
			features: [{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [13.4, 52.52] } }]
		}
	})
});

useLayer({
	layerId: 'composable-circles',
	type: 'circle',
	source: 'composable-points',
	options: () => ({ paint: { 'circle-radius': 10, 'circle-color': paintColor.value } })
});

useMapEvent('moveend', e => console.log('composable moveend', e.target.getCenter()));
</script>
