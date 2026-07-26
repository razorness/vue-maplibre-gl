<template>
	<div class="demo">
		<ClientOnly>
			<MglMap :map-style="demoStyles[0]!.style" :center="[7.1, 50.7]" :zoom="4" class="demo-map" style="height: 340px">
				<MglStyleSwitchControl :map-styles="demoStyles" position="top-right" />
				<!--
					The point of the demo: this source and layer are added by the components, thrown away by
					the style switch, and re-added afterwards — without losing the paint properties below.
				-->
				<MglGeoJsonSource source-id="switch-line" :data="data">
					<MglLineLayer layer-id="switch-line" :paint="{ 'line-color': '#e4572e', 'line-width': 4 }" />
				</MglGeoJsonSource>
			</MglMap>
		</ClientOnly>
		<p class="demo-status">Switch the style: the red line survives, because the layer re-adds itself on `style.load`.</p>
	</div>
</template>

<script setup lang="ts">
import { MglGeoJsonSource, MglLineLayer, MglMap, MglStyleSwitchControl } from 'vue-maplibre-gl';
import { demoStyles } from './mapStyle';

const data = {
	type: 'Feature' as const,
	properties: {},
	geometry: {
		type: 'LineString' as const,
		coordinates: [
			[-3.7, 40.42],
			[2.35, 48.86],
			[7.1, 50.73],
			[13.4, 52.52]
		]
	}
};
</script>
