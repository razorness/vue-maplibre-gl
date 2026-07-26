<template>
	<div class="demo">
		<div class="demo-bar">
			<label>
				<input v-model="globe" type="checkbox" />
				Globe projection
			</label>
			<span class="demo-status">…or use the control on the map</span>
		</div>
		<ClientOnly>
			<MglMap :map-style="demoStyle" :center="[7.1, 30]" :zoom="1.4" class="demo-map" style="height: 340px">
				<MglGlobeControl position="top-right" />
				<!-- declarative counterpart to the control: the setting, not the button -->
				<MglProjection v-if="globe" type="globe" />
			</MglMap>
		</ClientOnly>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { MglGlobeControl, MglMap, MglProjection } from 'vue-maplibre-gl';
import { demoStyle } from './mapStyle';

const globe = ref(true);
</script>
