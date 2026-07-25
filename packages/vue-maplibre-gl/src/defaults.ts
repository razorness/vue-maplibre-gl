import type { MapOptions as MaplibreMapOptions } from 'maplibre-gl';
import { reactive } from 'vue';
import type { ValidLanguages } from 'types';

export type MapOptions = Omit<MaplibreMapOptions, 'container' | 'style'> & { style: object | string; language?: ValidLanguages };

export const defaults = reactive<MapOptions>({
	style: 'https://demotiles.maplibre.org/style.json',
	center: [0, 0],
	zoom: 1,
	trackResize: false
});
