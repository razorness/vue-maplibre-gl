import { LngLatLike, MapboxOptions } from 'maplibre-gl';
import { reactive } from 'vue';

export const defaults = reactive<Omit<MapboxOptions, 'container'>>({
	style      : 'https://demotiles.maplibre.org/style.json',
	center     : Object.freeze([ 0, 0 ]) as LngLatLike,
	zoom       : 1,
	trackResize: false
});
