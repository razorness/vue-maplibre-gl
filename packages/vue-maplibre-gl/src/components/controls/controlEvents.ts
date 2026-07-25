import type { FullscreenControlEventType, GeolocateControlEventType } from 'maplibre-gl';
import type { AssertNever } from 'types/exhaustive';

/*
 * maplibre v6 gave `GeolocateControl` and `FullscreenControl` typed event maps. The emit shapes are
 * spelled out rather than derived with `{ [K in keyof X]: … }`, because Vue's SFC compiler cannot evaluate
 * a mapped type over a `.d.ts` from node_modules — `vue-tsc` accepts it but `vite build` fails in
 * `extractRuntimeEmits`, since the runtime emits array is generated at compile time.
 *
 * The `AssertNever` pairs below make the literals impossible to drift from maplibre: adding or losing an
 * event breaks the build and names the offending event.
 */

export interface MglGeolocationEmits {
	geolocate: [ev: GeolocateControlEventType['geolocate']];
	error: [ev: GeolocateControlEventType['error']];
	outofmaxbounds: [ev: GeolocateControlEventType['outofmaxbounds']];
	trackuserlocationstart: [ev: GeolocateControlEventType['trackuserlocationstart']];
	trackuserlocationend: [ev: GeolocateControlEventType['trackuserlocationend']];
	userlocationfocus: [ev: GeolocateControlEventType['userlocationfocus']];
	userlocationlostfocus: [ev: GeolocateControlEventType['userlocationlostfocus']];
}

export type _GeolocationEmitsCoverEveryEvent = AssertNever<Exclude<keyof GeolocateControlEventType, keyof MglGeolocationEmits>>;
export type _GeolocationEmitsHaveNoExtras = AssertNever<Exclude<keyof MglGeolocationEmits, keyof GeolocateControlEventType>>;

export interface MglFullscreenEmits {
	fullscreenstart: [ev: FullscreenControlEventType['fullscreenstart']];
	fullscreenend: [ev: FullscreenControlEventType['fullscreenend']];
}

export type _FullscreenEmitsCoverEveryEvent = AssertNever<Exclude<keyof FullscreenControlEventType, keyof MglFullscreenEmits>>;
export type _FullscreenEmitsHaveNoExtras = AssertNever<Exclude<keyof MglFullscreenEmits, keyof FullscreenControlEventType>>;

/** Runtime event name lists, so the components can subscribe in a loop instead of one line each. */
export const GEOLOCATION_EVENTS = [
	'geolocate',
	'error',
	'outofmaxbounds',
	'trackuserlocationstart',
	'trackuserlocationend',
	'userlocationfocus',
	'userlocationlostfocus'
] as const satisfies ReadonlyArray<keyof MglGeolocationEmits>;

export const FULLSCREEN_EVENTS = ['fullscreenstart', 'fullscreenend'] as const satisfies ReadonlyArray<keyof MglFullscreenEmits>;
