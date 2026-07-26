import type { Map, MapEventType, MapOptions, MarkerOptions } from 'maplibre-gl';
import type { ComponentPublicInstance } from 'vue';
import type { MglEvent } from 'types';
import type { AssertNever } from 'types/exhaustive';
import { keysOf, keysOfExcept } from 'types/exhaustive';

export type MapEventHandler = (e: any) => void;

/**
 * Every event name `MglMap` emits: `'map:load' | 'map:click' | … | 'map:style.load'`.
 *
 * Derived from maplibre's `MapEventType`, so it cannot drift out of sync.
 */
export type MglMapEmitName = `map:${keyof MapEventType}`;

/**
 * Payload type per `map:*` event, as `defineEmits` needs it.
 *
 * Spelled out rather than derived with a mapped type over `MapEventType`, for the same reason
 * `MglLayerEmits` is: Vue's SFC compiler has its own, much more limited type resolver than tsc and
 * cannot evaluate a mapped type over a type imported from a `.d.ts` in node_modules. `vue-tsc` accepts
 * it, `vite build` then fails in `extractRuntimeEmits` — the runtime emits array is generated at
 * compile time.
 *
 * Writing it out is what gives consumers a typed payload: with the previous runtime array
 * (`defineEmits([...MAP_EMIT_NAMES])`) every handler received `any`. The two assertions below keep the
 * literal from drifting away from maplibre.
 */
export interface MglMapEmits {
	'map:boxzoomcancel': [ev: MglEvent<MapEventType['boxzoomcancel']>];
	'map:boxzoomend': [ev: MglEvent<MapEventType['boxzoomend']>];
	'map:boxzoomstart': [ev: MglEvent<MapEventType['boxzoomstart']>];
	'map:click': [ev: MglEvent<MapEventType['click']>];
	'map:contextmenu': [ev: MglEvent<MapEventType['contextmenu']>];
	'map:cooperativegestureprevented': [ev: MglEvent<MapEventType['cooperativegestureprevented']>];
	'map:data': [ev: MglEvent<MapEventType['data']>];
	'map:dataabort': [ev: MglEvent<MapEventType['dataabort']>];
	'map:dataloading': [ev: MglEvent<MapEventType['dataloading']>];
	'map:dblclick': [ev: MglEvent<MapEventType['dblclick']>];
	'map:drag': [ev: MglEvent<MapEventType['drag']>];
	'map:dragend': [ev: MglEvent<MapEventType['dragend']>];
	'map:dragstart': [ev: MglEvent<MapEventType['dragstart']>];
	/** maplibre reported an error. Failed async source updates surface here too, rather than being dropped. */
	'map:error': [ev: MglEvent<MapEventType['error']>];
	/** Rendering has settled: no transitions running and every tile loaded. */
	'map:idle': [ev: MglEvent<MapEventType['idle']>];
	/** The style has loaded and the map is ready. The usual place to touch the raw maplibre map. */
	'map:load': [ev: MglEvent<MapEventType['load']>];
	'map:mousedown': [ev: MglEvent<MapEventType['mousedown']>];
	'map:mousemove': [ev: MglEvent<MapEventType['mousemove']>];
	'map:mouseout': [ev: MglEvent<MapEventType['mouseout']>];
	'map:mouseover': [ev: MglEvent<MapEventType['mouseover']>];
	'map:mouseup': [ev: MglEvent<MapEventType['mouseup']>];
	'map:move': [ev: MglEvent<MapEventType['move']>];
	'map:moveend': [ev: MglEvent<MapEventType['moveend']>];
	'map:movestart': [ev: MglEvent<MapEventType['movestart']>];
	'map:pitch': [ev: MglEvent<MapEventType['pitch']>];
	'map:pitchend': [ev: MglEvent<MapEventType['pitchend']>];
	'map:pitchstart': [ev: MglEvent<MapEventType['pitchstart']>];
	'map:projectiontransition': [ev: MglEvent<MapEventType['projectiontransition']>];
	'map:remove': [ev: MglEvent<MapEventType['remove']>];
	'map:render': [ev: MglEvent<MapEventType['render']>];
	'map:resize': [ev: MglEvent<MapEventType['resize']>];
	'map:roll': [ev: MglEvent<MapEventType['roll']>];
	'map:rollend': [ev: MglEvent<MapEventType['rollend']>];
	'map:rollstart': [ev: MglEvent<MapEventType['rollstart']>];
	'map:rotate': [ev: MglEvent<MapEventType['rotate']>];
	'map:rotateend': [ev: MglEvent<MapEventType['rotateend']>];
	'map:rotatestart': [ev: MglEvent<MapEventType['rotatestart']>];
	'map:sourcedata': [ev: MglEvent<MapEventType['sourcedata']>];
	'map:sourcedataabort': [ev: MglEvent<MapEventType['sourcedataabort']>];
	'map:sourcedataloading': [ev: MglEvent<MapEventType['sourcedataloading']>];
	/** A style finished loading — fires again after every style switch. */
	'map:style.load': [ev: MglEvent<MapEventType['style.load']>];
	'map:styledata': [ev: MglEvent<MapEventType['styledata']>];
	'map:styledataloading': [ev: MglEvent<MapEventType['styledataloading']>];
	'map:styleimagemissing': [ev: MglEvent<MapEventType['styleimagemissing']>];
	'map:terrain': [ev: MglEvent<MapEventType['terrain']>];
	'map:touchcancel': [ev: MglEvent<MapEventType['touchcancel']>];
	'map:touchend': [ev: MglEvent<MapEventType['touchend']>];
	'map:touchmove': [ev: MglEvent<MapEventType['touchmove']>];
	'map:touchstart': [ev: MglEvent<MapEventType['touchstart']>];
	/** The WebGL context was lost. The component tears the map down and rebuilds it by itself. */
	'map:webglcontextlost': [ev: MglEvent<MapEventType['webglcontextlost']>];
	/** The WebGL context came back. */
	'map:webglcontextrestored': [ev: MglEvent<MapEventType['webglcontextrestored']>];
	'map:wheel': [ev: MglEvent<MapEventType['wheel']>];
	'map:zoom': [ev: MglEvent<MapEventType['zoom']>];
	'map:zoomend': [ev: MglEvent<MapEventType['zoomend']>];
	'map:zoomstart': [ev: MglEvent<MapEventType['zoomstart']>];
}

/** Proves {@link MglMapEmits} declares every maplibre map event. Exported only to satisfy `noUnusedLocals`. */
export type _MapEmitsCoverEveryEvent = AssertNever<Exclude<MglMapEmitName, keyof MglMapEmits>>;

/** The other direction: no declared emit that maplibre does not have. */
export type _MapEmitsHaveNoExtras = AssertNever<Exclude<keyof MglMapEmits, MglMapEmitName>>;

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
