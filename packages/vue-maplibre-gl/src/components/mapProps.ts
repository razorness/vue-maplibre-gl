import type { MapOptions, ProjectionSpecification } from 'maplibre-gl';
import type { PropType } from 'vue';
import type { FitBoundsOptions, ValidLanguages } from 'types';
import type { AssertNever } from 'types/exhaustive';
import { defaults } from '@/defaults';

/*
 * Every prop is named after the `MapOptions` key it sets, and every doc comment here is what a
 * consumer sees three times over: in the emitted d.ts, in the IDE (through `web-types.json`) and in
 * the API reference on the website. All three are generated from this file — never write a prop table
 * by hand.
 *
 * Defaults read through `defaults.*` so `MglDefaults` can be mutated before mount to set
 * library-wide defaults; a prop left undefined is not forwarded to maplibre at all, which is what
 * lets maplibre's own default apply.
 */
export const mapProps = {
	/** Width of the map container. A number is treated as pixels. */
	width: { type: [Number, String] as PropType<number | string>, default: '100%' },

	/**
	 * Height of the map container. A number is treated as pixels.
	 *
	 * The map has no intrinsic size — with a percentage height, the *parent* needs a height of its own,
	 * or the map collapses to nothing.
	 */
	height: { type: [Number, String] as PropType<number | string>, default: '100%' },

	/** Show the attribution control, or configure it. Attribution is a licence requirement for most tile sources. */
	attributionControl: {
		type: [Boolean, Object] as PropType<MapOptions['attributionControl']>,
		default: () => defaults.attributionControl
	},

	/** Initial bearing (rotation) in degrees counter-clockwise from north. Two-way bindable with `v-model:bearing`. */
	bearing: { type: Number as PropType<MapOptions['bearing']>, default: () => defaults.bearing },

	/** Snap to north once the bearing is within this many degrees of it. */
	bearingSnap: { type: Number as PropType<MapOptions['bearingSnap']>, default: () => defaults.bearingSnap },

	/**
	 * Fit the map to these bounds instead of using `center` and `zoom`.
	 *
	 * Two-way bindable with `v-model:bounds`, where reading gives the current viewport and writing fits
	 * the map to the box — the fit uses {@link fitBoundsOptions}.
	 */
	bounds: { type: [Array, Object] as PropType<MapOptions['bounds']>, default: () => defaults.bounds },

	/** Allow shift-drag to zoom to a box. */
	boxZoom: { type: Boolean, default: () => defaults.boxZoom },

	/** Abort in-flight tile requests while zooming, rather than letting them complete. */
	cancelPendingTileRequestsWhileZooming: {
		type: Boolean,
		default: () => defaults.cancelPendingTileRequestsWhileZooming
	},

	/** WebGL context attributes, e.g. `{ antialias: true }` or `{ preserveDrawingBuffer: true }` for screenshots. */
	canvasContextAttributes: {
		type: Object as PropType<MapOptions['canvasContextAttributes']>,
		default: () => defaults.canvasContextAttributes
	},

	/** Initial centre as `[lng, lat]` or a `LngLat`. Two-way bindable with `v-model:center`. */
	center: { type: [Array, Object] as PropType<MapOptions['center']>, default: () => defaults.center },

	/** Keep the centre pinned to the ground rather than to the camera target when the terrain moves. */
	centerClampedToGround: { type: Boolean, default: () => defaults.centerClampedToGround },

	/** Pointer movement in pixels that still counts as a click rather than a drag. */
	clickTolerance: { type: Number as PropType<MapOptions['clickTolerance']>, default: () => defaults.clickTolerance },

	/** Collect `resourceTiming` data for tile requests and report it on the data events. */
	collectResourceTiming: { type: Boolean, default: () => defaults.collectResourceTiming },

	/** Require ctrl/⌘ to zoom with the wheel and two fingers to pan, so the map does not hijack page scrolling. */
	cooperativeGestures: {
		type: [Boolean, Object] as PropType<MapOptions['cooperativeGestures']>,
		default: () => defaults.cooperativeGestures
	},

	/** Let labels from different sources collide with each other. Turning this off speeds up label placement. */
	crossSourceCollisions: { type: Boolean, default: () => defaults.crossSourceCollisions },

	/** Allow double-click and shift-double-click to zoom. */
	doubleClickZoom: { type: Boolean, default: () => defaults.doubleClickZoom },

	/** Allow panning by dragging. */
	dragPan: { type: Boolean, default: () => defaults.dragPan },

	/** Allow rotating by right-drag or ctrl-drag. */
	dragRotate: { type: Boolean, default: () => defaults.dragRotate },

	/** Camera elevation in metres above the terrain. */
	elevation: { type: Number as PropType<MapOptions['elevation']>, default: () => defaults.elevation },

	/** Cross-fade duration in milliseconds for labels and symbols as tiles change zoom level. */
	fadeDuration: { type: Number as PropType<MapOptions['fadeDuration']>, default: () => defaults.fadeDuration },

	/**
	 * Options for every `fitBounds` this map performs — padding, animation, `maxZoom`.
	 *
	 * Also shared with the draw plugin for its viewport padding. Set `useOnBoundsUpdate` to reuse these
	 * options when `v-model:bounds` writes a new box.
	 */
	fitBoundsOptions: { type: Object as PropType<FitBoundsOptions>, default: () => defaults.fitBoundsOptions },

	/** Sync the camera to the URL hash (`#zoom/lat/lng`). A string uses it as the parameter name. */
	hash: { type: [Boolean, String] as PropType<MapOptions['hash']>, default: () => defaults.hash },

	/** Master switch for all user interaction. `false` gives a static map that can still be moved from code. */
	interactive: { type: Boolean, default: () => defaults.interactive },

	/** Allow keyboard navigation when the map has focus. */
	keyboard: { type: Boolean, default: () => defaults.keyboard },

	/**
	 * Rewrites every symbol layer's `text-field` to this language, e.g. `'de'`.
	 *
	 * Not a maplibre option: the expressions are rewritten to
	 * `['coalesce', ['get', 'name:de'], ['get', 'name']]`, so it needs a style whose tiles carry
	 * `name:xx` fields. Also writeable through `useMap().language`.
	 */
	language: { type: String as PropType<ValidLanguages | undefined>, default: () => defaults.language || undefined },

	/** Overrides for maplibre's own UI strings, e.g. control tooltips. */
	locale: { type: Object as PropType<MapOptions['locale']>, default: () => defaults.locale },

	/** Font family used to render CJK glyphs locally instead of loading them from the style's glyph endpoint. */
	localIdeographFontFamily: {
		type: String as PropType<MapOptions['localIdeographFontFamily']>,
		default: () => defaults.localIdeographFontFamily
	},

	/** Corner the maplibre logo sits in. */
	logoPosition: { type: [String] as PropType<MapOptions['logoPosition']>, default: () => defaults.logoPosition },

	/**
	 * Key this map is registered under, so `useMap(key)` can reach it from anywhere.
	 *
	 * Not a maplibre option. Omit it and the map registers under a default symbol — which is fine until
	 * a second map is mounted, at which point both want the same slot.
	 */
	mapKey: { type: [String, Symbol] as PropType<string | symbol> },

	/** Show the maplibre logo. Check the licence of your tile source before turning this off. */
	maplibreLogo: { type: Boolean, default: () => defaults.maplibreLogo },

	/**
	 * The style: a URL, or a style specification object.
	 *
	 * This is maplibre's `style` option. It is called `mapStyle` because `style` is the HTML style
	 * attribute; the rename is undone when the map is constructed. Changing it calls `setStyle` with
	 * `{ diff: false }`, and sources and layers re-add themselves afterwards.
	 */
	// StyleSpecification triggers TS7056, so users must handle typings themselves
	mapStyle: { type: [String, Object] as PropType<object | string>, default: () => defaults.style },

	/** Restrict panning to these bounds. The camera is clamped, so what comes back from a move may differ from what you set. */
	maxBounds: { type: [Array, Object] as PropType<MapOptions['maxBounds']>, default: () => defaults.maxBounds },

	/** Upper bound for the canvas size as `[width, height]` in pixels. */
	maxCanvasSize: { type: Array as unknown as PropType<MapOptions['maxCanvasSize']>, default: () => defaults.maxCanvasSize },

	/** Maximum pitch in degrees, up to 85. */
	maxPitch: { type: Number as PropType<MapOptions['maxPitch']>, default: () => defaults.maxPitch },

	/** Number of tiles kept in the cache. */
	maxTileCacheSize: { type: Number as PropType<number>, default: () => defaults.maxTileCacheSize },

	/** How many zoom levels' worth of tiles to keep cached. */
	maxTileCacheZoomLevels: {
		type: Number as PropType<MapOptions['maxTileCacheZoomLevels']>,
		default: () => defaults.maxTileCacheZoomLevels
	},

	/** Maximum zoom level. */
	maxZoom: { type: Number as PropType<MapOptions['maxZoom']>, default: () => defaults.maxZoom },

	/** Minimum pitch in degrees. */
	minPitch: { type: Number as PropType<MapOptions['minPitch']>, default: () => defaults.minPitch },

	/** Minimum zoom level. */
	minZoom: { type: Number as PropType<MapOptions['minZoom']>, default: () => defaults.minZoom },

	/** Initial pitch (tilt) in degrees away from straight down. Two-way bindable with `v-model:pitch`. */
	pitch: { type: Number as PropType<MapOptions['pitch']>, default: () => defaults.pitch },

	/** Let a drag-rotate gesture change the pitch as well as the bearing. */
	pitchWithRotate: { type: Boolean, default: () => defaults.pitchWithRotate },

	/** Device pixel ratio to render at. Lowering it trades sharpness for frame rate. */
	pixelRatio: { type: Number as PropType<MapOptions['pixelRatio']>, default: () => defaults.pixelRatio },

	/** Re-request tiles once their HTTP cache headers expire. */
	refreshExpiredTiles: { type: Boolean, default: () => defaults.refreshExpiredTiles },

	/** Repeat the world horizontally when zoomed out. */
	renderWorldCopies: { type: Boolean, default: () => defaults.renderWorldCopies },

	/** Initial roll in degrees around the camera axis. Two-way bindable with `v-model:roll`, and only effective with {@link rollEnabled}. */
	roll: { type: Number as PropType<MapOptions['roll']>, default: () => defaults.roll },

	/** Allow the camera to roll. */
	// was `typed:` instead of `type:`, which left the prop effectively untyped and uncoerced
	rollEnabled: { type: Boolean, default: () => defaults.rollEnabled },

	/** Allow zooming with the mouse wheel. See {@link cooperativeGestures} to keep page scrolling working. */
	scrollZoom: { type: Boolean, default: () => defaults.scrollZoom },

	/** Allow changing the pitch with a two-finger drag. */
	touchPitch: { type: Boolean, default: () => defaults.touchPitch },

	/** Allow pinch to zoom and rotate. */
	touchZoomRotate: { type: Boolean, default: () => defaults.touchZoomRotate },

	/**
	 * Let maplibre resize the map on `window.resize`.
	 *
	 * Independent of this component's own `ResizeObserver`, which watches the *container* and therefore
	 * also catches layout changes that leave the window size untouched.
	 */
	trackResize: { type: Boolean, default: () => defaults.trackResize },

	/** Intercept every camera update, e.g. to constrain it. Called on each frame of an animation. */
	transformCameraUpdate: {
		type: Function as PropType<NonNullable<MapOptions['transformCameraUpdate']>>,
		default: defaults.transformCameraUpdate
	},

	/** Rewrite tile and resource requests — add an API key, a header, or a proxy. */
	transformRequest: { type: Function as PropType<NonNullable<MapOptions['transformRequest']>>, default: defaults.transformRequest },

	/** Validate the style against the style specification. Worth leaving on in development and off in production. */
	validateStyle: { type: Boolean, default: () => defaults.validateStyle },

	/** Initial zoom level. Two-way bindable with `v-model:zoom`; note that {@link zoomSnap} may round what comes back. */
	zoom: { type: Number as PropType<MapOptions['zoom']>, default: () => defaults.zoom },

	/**
	 * Map projection, e.g. `{ type: 'globe' }`.
	 *
	 * Not a `MapOptions` key but a style-level setting, so it is applied through `setProjection` once
	 * the style is ready and re-applied after a style switch. `MglProjection` and `MglGlobeControl` are
	 * the declarative and interactive alternatives.
	 */
	projection: { type: Object as PropType<ProjectionSpecification> },

	/*
	 * maplibre-gl v6 options. Previously missing (`zoomSnap`, `aroundCenter`,
	 * `anisotropicFilterPitch`, `transformConstrain`) or new in v6 (`reduceMotion`,
	 * `terrainSkirtLength`, `zoomLevelsToOverscale`, which replaces the v5
	 * `experimentalZoomLevelsToOverscale`). The coverage assertion below now makes leaving one
	 * out a compile error.
	 */

	/** Pitch above which anisotropic texture filtering kicks in, trading fill rate for sharper oblique tiles. */
	anisotropicFilterPitch: {
		type: Number as PropType<MapOptions['anisotropicFilterPitch']>,
		default: () => defaults.anisotropicFilterPitch
	},

	/** Zoom around the map centre rather than around the pointer. */
	aroundCenter: { type: Boolean, default: () => defaults.aroundCenter },

	/** Skip camera animations, for users who asked for reduced motion. */
	reduceMotion: { type: Boolean, default: () => defaults.reduceMotion },

	/** Length of the skirt drawn around terrain tiles to hide seams. */
	terrainSkirtLength: { type: String as PropType<MapOptions['terrainSkirtLength']>, default: () => defaults.terrainSkirtLength },

	/** Constrain the transform after every camera change — the low-level counterpart to {@link maxBounds}. */
	transformConstrain: { type: Function as PropType<NonNullable<MapOptions['transformConstrain']>>, default: defaults.transformConstrain },

	/** Render tiles from this many zoom levels below the current one, instead of loading new ones. */
	zoomLevelsToOverscale: { type: Number as PropType<MapOptions['zoomLevelsToOverscale']>, default: () => defaults.zoomLevelsToOverscale },

	/**
	 * Snap the zoom to multiples of this value. Set it to `0` for continuous zoom.
	 *
	 * This is why the camera binding cannot compare values to detect an echo: with the default of `1`, a
	 * `zoom` of `4.3` comes back as `4`.
	 */
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
