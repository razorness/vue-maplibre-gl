import type { MapOptions, ProjectionSpecification } from 'maplibre-gl';
import type { PropType } from 'vue';
import type { FitBoundsOptions, ValidLanguages } from 'types';
import type { AssertNever } from 'types/exhaustive';
import { defaults } from '@/defaults';

export const mapProps = {
	width: { type: [Number, String] as PropType<number | string>, default: '100%' },
	height: { type: [Number, String] as PropType<number | string>, default: '100%' },
	attributionControl: {
		type: [Boolean, Object] as PropType<MapOptions['attributionControl']>,
		default: () => defaults.attributionControl
	},
	bearing: { type: Number as PropType<MapOptions['bearing']>, default: () => defaults.bearing },
	bearingSnap: { type: Number as PropType<MapOptions['bearingSnap']>, default: () => defaults.bearingSnap },
	bounds: { type: [Array, Object] as PropType<MapOptions['bounds']>, default: () => defaults.bounds },
	boxZoom: { type: Boolean, default: () => defaults.boxZoom },

	cancelPendingTileRequestsWhileZooming: {
		type: Boolean,
		default: () => defaults.cancelPendingTileRequestsWhileZooming
	},

	canvasContextAttributes: {
		type: Object as PropType<MapOptions['canvasContextAttributes']>,
		default: () => defaults.canvasContextAttributes
	},
	center: { type: [Array, Object] as PropType<MapOptions['center']>, default: () => defaults.center },
	centerClampedToGround: { type: Boolean, default: () => defaults.centerClampedToGround },
	clickTolerance: { type: Number as PropType<MapOptions['clickTolerance']>, default: () => defaults.clickTolerance },
	collectResourceTiming: { type: Boolean, default: () => defaults.collectResourceTiming },
	cooperativeGestures: {
		type: [Boolean, Object] as PropType<MapOptions['cooperativeGestures']>,
		default: () => defaults.cooperativeGestures
	},
	crossSourceCollisions: { type: Boolean, default: () => defaults.crossSourceCollisions },
	doubleClickZoom: { type: Boolean, default: () => defaults.doubleClickZoom },
	dragPan: { type: Boolean, default: () => defaults.dragPan },
	dragRotate: { type: Boolean, default: () => defaults.dragRotate },
	elevation: { type: Number as PropType<MapOptions['elevation']>, default: () => defaults.elevation },
	fadeDuration: { type: Number as PropType<MapOptions['fadeDuration']>, default: () => defaults.fadeDuration },
	fitBoundsOptions: { type: Object as PropType<FitBoundsOptions>, default: () => defaults.fitBoundsOptions },
	hash: { type: [Boolean, String] as PropType<MapOptions['hash']>, default: () => defaults.hash },
	interactive: { type: Boolean, default: () => defaults.interactive },
	keyboard: { type: Boolean, default: () => defaults.keyboard },
	language: { type: String as PropType<ValidLanguages | undefined>, default: () => defaults.language || undefined },
	locale: { type: Object as PropType<MapOptions['locale']>, default: () => defaults.locale },

	localIdeographFontFamily: {
		type: String as PropType<MapOptions['localIdeographFontFamily']>,
		default: () => defaults.localIdeographFontFamily
	},

	logoPosition: { type: [String] as PropType<MapOptions['logoPosition']>, default: () => defaults.logoPosition },
	mapKey: { type: [String, Symbol] as PropType<string | symbol> },
	maplibreLogo: { type: Boolean, default: () => defaults.maplibreLogo },
	// StyleSpecification triggers TS7056, so users must handle typings themselves
	mapStyle: { type: [String, Object] as PropType<object | string>, default: () => defaults.style },
	maxBounds: { type: [Array, Object] as PropType<MapOptions['maxBounds']>, default: () => defaults.maxBounds },
	maxCanvasSize: { type: Array as unknown as PropType<MapOptions['maxCanvasSize']>, default: () => defaults.maxCanvasSize },
	maxPitch: { type: Number as PropType<MapOptions['maxPitch']>, default: () => defaults.maxPitch },
	maxTileCacheSize: { type: Number as PropType<number>, default: () => defaults.maxTileCacheSize },
	maxTileCacheZoomLevels: {
		type: Number as PropType<MapOptions['maxTileCacheZoomLevels']>,
		default: () => defaults.maxTileCacheZoomLevels
	},
	maxZoom: { type: Number as PropType<MapOptions['maxZoom']>, default: () => defaults.maxZoom },
	minPitch: { type: Number as PropType<MapOptions['minPitch']>, default: () => defaults.minPitch },
	minZoom: { type: Number as PropType<MapOptions['minZoom']>, default: () => defaults.minZoom },
	pitch: { type: Number as PropType<MapOptions['pitch']>, default: () => defaults.pitch },
	pitchWithRotate: { type: Boolean, default: () => defaults.pitchWithRotate },
	pixelRatio: { type: Number as PropType<MapOptions['pixelRatio']>, default: () => defaults.pixelRatio },
	refreshExpiredTiles: { type: Boolean, default: () => defaults.refreshExpiredTiles },
	renderWorldCopies: { type: Boolean, default: () => defaults.renderWorldCopies },
	roll: { type: Number as PropType<MapOptions['roll']>, default: () => defaults.roll },
	// was `typed:` instead of `type:`, which left the prop effectively untyped and uncoerced
	rollEnabled: { type: Boolean, default: () => defaults.rollEnabled },
	scrollZoom: { type: Boolean, default: () => defaults.scrollZoom },
	touchPitch: { type: Boolean, default: () => defaults.touchPitch },
	touchZoomRotate: { type: Boolean, default: () => defaults.touchZoomRotate },
	trackResize: { type: Boolean, default: () => defaults.trackResize },
	transformCameraUpdate: {
		type: Function as PropType<NonNullable<MapOptions['transformCameraUpdate']>>,
		default: defaults.transformCameraUpdate
	},
	transformRequest: { type: Function as PropType<NonNullable<MapOptions['transformRequest']>>, default: defaults.transformRequest },
	validateStyle: { type: Boolean, default: () => defaults.validateStyle },
	zoom: { type: Number as PropType<MapOptions['zoom']>, default: () => defaults.zoom },
	projection: { type: Object as PropType<ProjectionSpecification> },

	/*
	 * maplibre-gl v6 options. Previously missing (`zoomSnap`, `aroundCenter`,
	 * `anisotropicFilterPitch`, `transformConstrain`) or new in v6 (`reduceMotion`,
	 * `terrainSkirtLength`, `zoomLevelsToOverscale`, which replaces the v5
	 * `experimentalZoomLevelsToOverscale`). The coverage assertion below now makes leaving one
	 * out a compile error.
	 */
	anisotropicFilterPitch: {
		type: Number as PropType<MapOptions['anisotropicFilterPitch']>,
		default: () => defaults.anisotropicFilterPitch
	},
	aroundCenter: { type: Boolean, default: () => defaults.aroundCenter },
	reduceMotion: { type: Boolean, default: () => defaults.reduceMotion },
	terrainSkirtLength: { type: String as PropType<MapOptions['terrainSkirtLength']>, default: () => defaults.terrainSkirtLength },
	transformConstrain: { type: Function as PropType<NonNullable<MapOptions['transformConstrain']>>, default: defaults.transformConstrain },
	zoomLevelsToOverscale: { type: Number as PropType<MapOptions['zoomLevelsToOverscale']>, default: () => defaults.zoomLevelsToOverscale },
	zoomSnap: { type: Number as PropType<MapOptions['zoomSnap']>, default: () => defaults.zoomSnap }
} as const;

/*
 * Proof that `mapProps` covers every maplibre map option.
 *
 * `container` is owned by the component and `style` is exposed as `mapStyle`; everything else must
 * have a prop. If maplibre-gl adds an option and nobody declares a prop for it, this line stops
 * compiling and the error message names the missing option. Together with `keysOf` in
 * `lib/map.lib.ts` (which proves the runtime key list is complete) that closes the loop:
 * a new maplibre option can no longer slip through unnoticed.
 *
 * `export`ed only to satisfy `noUnusedLocals` — it emits nothing and `components/index.ts` re-exports
 * just this module's default, so it never reaches the package's public API.
 */
export type _MapOptionsAreFullyCovered = AssertNever<Exclude<keyof MapOptions, 'container' | 'style' | keyof typeof mapProps>>;
