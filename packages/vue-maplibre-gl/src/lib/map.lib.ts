import type { Map, MapEventType, MapOptions, MarkerOptions } from 'maplibre-gl';
import type { ComponentPublicInstance } from 'vue';
import type { MglEvent } from 'types';
import { keysOf, keysOfExcept } from 'types/exhaustive';

export type MapEventHandler = (e: any) => void;

/**
 * Every event name `MglMap` emits: `'map:load' | 'map:click' | … | 'map:style.load'`.
 *
 * Derived from maplibre's `MapEventType`, so it cannot drift out of sync.
 */
export type MglMapEmitName = `map:${keyof MapEventType}`;

/**
 * Keys that exist on `MapOptions` but must not become an `MglMap` prop:
 * `container` is created by the component, and `style` is exposed under the name `mapStyle`
 * (`style` would collide with the DOM attribute).
 */
const NON_PROP_MAP_OPTIONS = ['container', 'style'] as const;

type NonPropMapOption = (typeof NON_PROP_MAP_OPTIONS)[number];

/*
 * Every list below is built with `keysOf`, so it is *proven* complete against the maplibre type at
 * compile time. When maplibre-gl adds an option or an event, these calls stop compiling and name the
 * missing key — which is the signal to add the matching prop/emit. Never hand-maintain them again.
 *
 * See `../types/exhaustive.ts`.
 */
export class MapLib {

	/** Option keys forwarded from props into the `Map` constructor, plus the renamed `mapStyle`. */
	static readonly MAP_OPTION_KEYS: Array<Exclude<keyof MapOptions, NonPropMapOption> | 'mapStyle'> = [
		...keysOfExcept<MapOptions, NonPropMapOption>(
			{
				anisotropicFilterPitch: 0,
				aroundCenter: 0,
				attributionControl: 0,
				bearing: 0,
				bearingSnap: 0,
				bounds: 0,
				boxZoom: 0,
				cancelPendingTileRequestsWhileZooming: 0,
				canvasContextAttributes: 0,
				center: 0,
				centerClampedToGround: 0,
				clickTolerance: 0,
				collectResourceTiming: 0,
				container: 0,
				cooperativeGestures: 0,
				crossSourceCollisions: 0,
				doubleClickZoom: 0,
				dragPan: 0,
				dragRotate: 0,
				elevation: 0,
				fadeDuration: 0,
				fitBoundsOptions: 0,
				hash: 0,
				interactive: 0,
				keyboard: 0,
				locale: 0,
				localIdeographFontFamily: 0,
				logoPosition: 0,
				maplibreLogo: 0,
				maxBounds: 0,
				maxCanvasSize: 0,
				maxPitch: 0,
				maxTileCacheSize: 0,
				maxTileCacheZoomLevels: 0,
				maxZoom: 0,
				minPitch: 0,
				minZoom: 0,
				pitch: 0,
				pitchWithRotate: 0,
				pixelRatio: 0,
				reduceMotion: 0,
				refreshExpiredTiles: 0,
				renderWorldCopies: 0,
				roll: 0,
				rollEnabled: 0,
				scrollZoom: 0,
				style: 0,
				terrainSkirtLength: 0,
				touchPitch: 0,
				touchZoomRotate: 0,
				trackResize: 0,
				transformCameraUpdate: 0,
				transformConstrain: 0,
				transformRequest: 0,
				validateStyle: 0,
				zoom: 0,
				zoomLevelsToOverscale: 0,
				zoomSnap: 0
			},
			NON_PROP_MAP_OPTIONS
		),
		'mapStyle'
	];

	static readonly MARKER_OPTION_KEYS = keysOf<MarkerOptions>({
		anchor: 0,
		className: 0,
		clickTolerance: 0,
		color: 0,
		draggable: 0,
		element: 0,
		offset: 0,
		opacity: 0,
		opacityWhenCovered: 0,
		pitchAlignment: 0,
		rotation: 0,
		rotationAlignment: 0,
		scale: 0,
		subpixelPositioning: 0
	});

	/**
	 * Every event a maplibre `Map` can fire. Emitted by `MglMap` prefixed with `map:`
	 * (`@map:click`, `@map:style.load`, …).
	 *
	 * v6 typed `Map.on`/`Map.off` as `keyof MapEventType`, so a plain `string[]` no longer compiles —
	 * that is what caught `tiledataloading` (removed in v6) and the missing `roll*` / `style.load`.
	 */
	static readonly MAP_EVENT_TYPES = keysOf<MapEventType>({
		boxzoomcancel: 0,
		boxzoomend: 0,
		boxzoomstart: 0,
		click: 0,
		contextmenu: 0,
		cooperativegestureprevented: 0,
		data: 0,
		dataabort: 0,
		dataloading: 0,
		dblclick: 0,
		drag: 0,
		dragend: 0,
		dragstart: 0,
		error: 0,
		idle: 0,
		load: 0,
		mousedown: 0,
		mousemove: 0,
		mouseout: 0,
		mouseover: 0,
		mouseup: 0,
		move: 0,
		moveend: 0,
		movestart: 0,
		pitch: 0,
		pitchend: 0,
		pitchstart: 0,
		projectiontransition: 0,
		remove: 0,
		render: 0,
		resize: 0,
		roll: 0,
		rollend: 0,
		rollstart: 0,
		rotate: 0,
		rotateend: 0,
		rotatestart: 0,
		sourcedata: 0,
		sourcedataabort: 0,
		sourcedataloading: 0,
		'style.load': 0,
		styledata: 0,
		styledataloading: 0,
		styleimagemissing: 0,
		terrain: 0,
		touchcancel: 0,
		touchend: 0,
		touchmove: 0,
		touchstart: 0,
		webglcontextlost: 0,
		webglcontextrestored: 0,
		wheel: 0,
		zoom: 0,
		zoomend: 0,
		zoomstart: 0
	});

	/**
	 * The `map:<event>` emit names matching {@link MAP_EVENT_TYPES}.
	 *
	 * Typed as `MglMapEmitName[]` rather than `string[]` on purpose: the template literal type keeps
	 * the names as literals, so `MglMap`'s `emits` stays fully typed for consumers (`@map:click`
	 * autocompletes, `@map:tiledataloading` is an error) while still being derived from maplibre's own
	 * event map instead of hand-written.
	 */
	static readonly MAP_EMIT_NAMES = MapLib.MAP_EVENT_TYPES.map(e => `map:${e}`) as MglMapEmitName[];

	/*
	 * `component` is typed as the generic `ComponentPublicInstance` rather than
	 * `InstanceType<typeof MglMap>`: the concrete type would require importing the component barrel
	 * from the lib layer, which is a real `lib/ <-> components/` import cycle. `MglEvent`'s `C` type
	 * parameter lets consumers narrow it back.
	 */
	static createEventHandler(
		component: ComponentPublicInstance,
		map: Map,
		ctx: {
			emit: (t: string, payload: any) => void;
		},
		eventName: string
	): MapEventHandler {
		return (payload = {}) => ctx.emit(eventName, { type: payload.type, map, component, event: payload } as MglEvent);
	}

}
