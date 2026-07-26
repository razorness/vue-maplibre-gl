<template>
	<div class="demo">
		<!--
			maplibre needs a canvas, so a live map cannot be server-rendered. `ClientOnly` is what keeps
			`vitepress build` working — the library itself is SSR-safe, but a WebGL context is not.
		-->
		<ClientOnly>
			<MglMap :map-style="style" :center="center" :zoom="zoom" :style="{ height }" class="demo-map" @map:load="$emit('load')">
				<slot />
			</MglMap>
		</ClientOnly>
	</div>
</template>

<script setup lang="ts">
import type { LngLatLike } from 'maplibre-gl';
import { MglMap } from 'vue-maplibre-gl';

/**
 * Shared frame for every live demo in the docs.
 *
 * Falls back to `demotiles.maplibre.org`, so the docs build and run without an API key. Set
 * `VITE_MAP_STYLE_KEY` in `docs/.env.local` to point the demos at MapTiler instead.
 */
withDefaults(
	defineProps<{
		center?: LngLatLike;
		zoom?: number;
		height?: string;
	}>(),
	{
		center: () => [7.1, 50.7] as LngLatLike,
		zoom: 4,
		height: '360px'
	}
);

defineEmits<{ load: [] }>();
defineSlots<{ default?: () => unknown }>();

const key = import.meta.env.VITE_MAP_STYLE_KEY;
const style = key ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${key}` : 'https://demotiles.maplibre.org/style.json';
</script>
