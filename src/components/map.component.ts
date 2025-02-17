import { defaults } from '@/defaults';
import { debounce } from '@/lib/debounce';
import { MapLib } from '@/lib/map.lib';
import { registerMap } from '@/lib/mapRegistry';
import {
	componentIdSymbol,
	emitterSymbol,
	type FitBoundsOptions,
	fitBoundsOptionsSymbol,
	isInitializedSymbol,
	isLoadedSymbol,
	mapSymbol,
	type MglEvents,
	sourceIdSymbol,
	type ValidLanguages
} from '@/types';
import type { ProjectionSpecification } from '@maplibre/maplibre-gl-style-spec';
import { Map as MaplibreMap, type MapOptions, type StyleSpecification } from 'maplibre-gl';
import mitt from 'mitt';
import { setPrimaryLanguage } from 'modular-maptiler-sdk/src/language';
import {
	defineComponent,
	getCurrentInstance,
	h,
	markRaw,
	nextTick,
	onBeforeUnmount,
	onMounted,
	type PropType,
	provide,
	ref,
	shallowRef,
	type SlotsType,
	unref,
	watch
} from 'vue';

export default /*#__PURE__*/ defineComponent({
	name : 'MglMap',
	props: {
		width             : { type: [ Number, String ] as PropType<number | string>, default: '100%' },
		height            : { type: [ Number, String ] as PropType<number | string>, default: '100%' },
		attributionControl: { type: [ Boolean, Object ] as PropType<MapOptions['attributionControl']>, default: () => defaults.attributionControl },
		bearing           : { type: Number as PropType<MapOptions['bearing']>, default: () => defaults.bearing },
		bearingSnap       : { type: Number as PropType<MapOptions['bearingSnap']>, default: () => defaults.bearingSnap },
		bounds            : { type: [ Array, Object ] as PropType<MapOptions['bounds']>, default: () => defaults.bounds },
		boxZoom           : { type: Boolean as PropType<MapOptions['boxZoom']>, default: () => defaults.boxZoom },

		cancelPendingTileRequestsWhileZooming: {
			type: Boolean as PropType<MapOptions['cancelPendingTileRequestsWhileZooming']>, default: () => defaults.cancelPendingTileRequestsWhileZooming
		},

		canvasContextAttributes: { type: Object as PropType<MapOptions['canvasContextAttributes']>, default: () => defaults.canvasContextAttributes },
		center                 : { type: [ Array, Object ] as PropType<MapOptions['center']>, default: () => defaults.center },
		centerClampedToGround  : { type: Boolean as PropType<MapOptions['centerClampedToGround']>, default: () => defaults.centerClampedToGround },
		clickTolerance         : { type: Number as PropType<MapOptions['clickTolerance']>, default: () => defaults.clickTolerance },
		collectResourceTiming  : { type: Boolean as PropType<MapOptions['collectResourceTiming']>, default: () => defaults.collectResourceTiming },
		cooperativeGestures    : { type: [ Boolean, Object ] as PropType<MapOptions['cooperativeGestures']>, default: () => defaults.cooperativeGestures },
		crossSourceCollisions  : { type: Boolean as PropType<MapOptions['crossSourceCollisions']>, default: () => defaults.crossSourceCollisions },
		doubleClickZoom        : { type: Boolean as PropType<MapOptions['doubleClickZoom']>, default: () => defaults.doubleClickZoom },
		dragPan                : { type: Boolean as PropType<MapOptions['dragPan']>, default: () => defaults.dragPan },
		dragRotate             : { type: Boolean as PropType<MapOptions['dragRotate']>, default: () => defaults.dragRotate },
		elevation              : { type: Number as PropType<MapOptions['elevation']>, default: () => defaults.elevation },
		fadeDuration           : { type: Number as PropType<MapOptions['fadeDuration']>, default: () => defaults.fadeDuration },
		fitBoundsOptions       : { type: Object as PropType<FitBoundsOptions>, default: () => defaults.fitBoundsOptions },
		hash                   : { type: [ Boolean, String ] as PropType<MapOptions['hash']>, default: () => defaults.hash },
		interactive            : { type: Boolean as PropType<MapOptions['interactive']>, default: () => defaults.interactive },
		keyboard               : { type: Boolean as PropType<MapOptions['keyboard']>, default: () => defaults.keyboard },
		language               : { type: String as PropType<ValidLanguages | null>, default: () => defaults.language || null },
		locale                 : { type: Object as PropType<MapOptions['locale']>, default: () => defaults.locale },

		localIdeographFontFamily: {
			type: String as PropType<MapOptions['localIdeographFontFamily']>, default: () => defaults.localIdeographFontFamily
		},

		logoPosition: { type: [ String ] as PropType<MapOptions['logoPosition']>, default: () => defaults.logoPosition },
		mapKey      : { type: [ String, Symbol ] as PropType<string | symbol> },
		maplibreLogo: { type: Boolean as PropType<MapOptions['maplibreLogo']>, default: () => defaults.maplibreLogo },
		// StyleSpecification triggers TS7056, so users must handle typings themselves
		mapStyle              : { type: [ String, Object ] as PropType<object | string>, default: () => defaults.style },
		maxBounds             : { type: [ Array, Object ] as PropType<MapOptions['maxBounds']>, default: () => defaults.maxBounds },
		maxCanvasSize         : { type: Array as unknown as PropType<MapOptions['maxCanvasSize']>, default: () => defaults.maxCanvasSize },
		maxPitch              : { type: Number as PropType<MapOptions['maxPitch']>, default: () => defaults.maxPitch },
		maxTileCacheSize      : { type: Number as PropType<number>, default: () => defaults.maxTileCacheSize },
		maxTileCacheZoomLevels: { type: Number as PropType<MapOptions['maxTileCacheZoomLevels']>, default: () => defaults.maxTileCacheZoomLevels },
		maxZoom               : { type: Number as PropType<MapOptions['maxZoom']>, default: () => defaults.maxZoom },
		minPitch              : { type: Number as PropType<MapOptions['minPitch']>, default: () => defaults.minPitch },
		minZoom               : { type: Number as PropType<MapOptions['minZoom']>, default: () => defaults.minZoom },
		pitch                 : { type: Number as PropType<MapOptions['pitch']>, default: () => defaults.pitch },
		pitchWithRotate       : { type: Boolean as PropType<MapOptions['pitchWithRotate']>, default: () => defaults.pitchWithRotate },
		pixelRatio            : { type: Number as PropType<MapOptions['pixelRatio']>, default: () => defaults.pixelRatio },
		refreshExpiredTiles   : { type: Boolean as PropType<MapOptions['refreshExpiredTiles']>, default: () => defaults.refreshExpiredTiles },
		renderWorldCopies     : { type: Boolean as PropType<MapOptions['renderWorldCopies']>, default: () => defaults.renderWorldCopies },
		roll                  : { type: Number as PropType<MapOptions['roll']>, default: () => defaults.roll },
		rollEnabled           : { typed: Boolean as PropType<MapOptions['rollEnabled']>, default: () => defaults.rollEnabled },
		scrollZoom            : { type: Boolean as PropType<MapOptions['scrollZoom']>, default: () => defaults.scrollZoom },
		touchPitch            : { type: Boolean as PropType<MapOptions['touchPitch']>, default: () => defaults.touchPitch },
		touchZoomRotate       : { type: Boolean as PropType<MapOptions['touchZoomRotate']>, default: () => defaults.touchZoomRotate },
		trackResize           : { type: Boolean as PropType<MapOptions['trackResize']>, default: () => defaults.trackResize },
		transformCameraUpdate : { type: Function as PropType<NonNullable<MapOptions['transformCameraUpdate']>>, default: defaults.transformCameraUpdate },
		transformRequest      : { type: Function as PropType<NonNullable<MapOptions['transformRequest']>>, default: defaults.transformRequest },
		validateStyle         : { type: Boolean as PropType<MapOptions['validateStyle']>, default: () => defaults.validateStyle },
		zoom                  : { type: Number as PropType<MapOptions['zoom']>, default: () => defaults.zoom },
		projection            : { type: Object as PropType<ProjectionSpecification> }
	},
	emits: [
		'map:boxzoomcancel', 'map:boxzoomend', 'map:boxzoomstart', 'map:click', 'map:contextmenu', 'map:cooperativegestureprevented', 'map:data',
		'map:dataabort', 'map:dataloading', 'map:dblclick', 'map:drag', 'map:dragend', 'map:dragstart', 'map:error', 'map:idle', 'map:load', 'map:mousedown',
		'map:mousemove', 'map:mouseout', 'map:mouseover', 'map:mouseup', 'map:move', 'map:moveend', 'map:movestart', 'map:pitch', 'map:pitchend',
		'map:pitchstart', 'map:projectiontransition', 'map:remove', 'map:render', 'map:resize', 'map:rotate', 'map:rotateend', 'map:rotatestart',
		'map:sourcedata', 'map:sourcedataabort', 'map:sourcedataloading', 'map:styledata', 'map:styledataloading', 'map:styleimagemissing', 'map:terrain',
		'map:tiledataloading', 'map:touchcancel', 'map:touchend', 'map:touchmove', 'map:touchstart', 'map:webglcontextlost', 'map:webglcontextrestored',
		'map:wheel', 'map:zoom', 'map:zoomend', 'map:zoomstart'
	],
	slots: Object as SlotsType<{ default: {} }>,
	setup(props, ctx) {

		const component      = markRaw(getCurrentInstance()!),
			  container      = shallowRef<HTMLDivElement>(),
			  map            = shallowRef<MaplibreMap>(),
			  isInitialized  = ref(false),
			  isLoaded       = ref(false),
			  isStyleReady   = ref(false),
			  boundMapEvents = new Map<string, Function>(),
			  emitter        = mitt<MglEvents>(),
			  registryItem   = registerMap(component as any, map, props.mapKey);

		let resizeObserver: ResizeObserver | undefined;

		provide(mapSymbol, map);
		provide(isLoadedSymbol, isLoaded);
		provide(isInitializedSymbol, isInitialized);
		provide(componentIdSymbol, component.uid);
		provide(sourceIdSymbol, '');
		provide(emitterSymbol, emitter);
		provide(fitBoundsOptionsSymbol, props.fitBoundsOptions);

		/*
		 * bind prop watchers
		 */
		watch(() => props.bearing, v => v && map.value?.setBearing(v));
		watch(() => props.bounds, v => v && map.value?.fitBounds(v, props.fitBoundsOptions?.useOnBoundsUpdate ? props.fitBoundsOptions : undefined));
		watch(() => props.center, v => v && map.value?.setCenter(v));
		watch(() => props.maxBounds, v => v && map.value?.setMaxBounds(v));
		watch(() => props.maxPitch, v => v && map.value?.setMaxPitch(v));
		watch(() => props.maxZoom, v => v && map.value?.setMaxZoom(v));
		watch(() => props.minPitch, v => v && map.value?.setMinPitch(v));
		watch(() => props.minZoom, v => v && map.value?.setMinZoom(v));
		watch(() => props.pitch, v => v && map.value?.setPitch(v));
		watch(() => props.renderWorldCopies, v => v && map.value?.setRenderWorldCopies(v));
		watch(() => props.mapStyle, v => v && map.value?.setStyle(v as StyleSpecification | string));
		watch(() => props.transformRequest, v => v && map.value?.setTransformRequest(v));
		watch(() => props.zoom, v => v && map.value?.setZoom(v));
		watch(() => props.projection, v => v && map.value?.setProjection(v));

		watch(() => props.language, v => {
			if (isStyleReady.value && map.value && registryItem.language !== (v || null)) {
				setPrimaryLanguage(map.value as any, v || '');
				registryItem.language = v || null;
			}
		});
		watch(() => registryItem.language, v => {
			if (isStyleReady.value && map.value) {
				setPrimaryLanguage(map.value as any, v || '');
			}
		});

		function onStyleReady() {
			isStyleReady.value = true;
			if (props.language) {
				registryItem.language = props.language;
			} else if (registryItem.language) {
				setPrimaryLanguage(map.value! as any, props.language || '');
			}
			if (props.projection) {
				map.value!.setProjection(props.projection);
			}
		}

		function initialize() {

			registryItem.isMounted = true;

			// build options
			const opts: MapOptions = Object.keys(props)
										   .filter(opt => (props as any)[ opt ] !== undefined && MapLib.MAP_OPTION_KEYS.indexOf(opt as keyof MapOptions) !== -1)
										   .reduce<MapOptions>((obj, opt) => {
											   (obj as any)[ opt === 'mapStyle' ? 'style' : opt ] = unref((props as any)[ opt ]);
											   return obj;
										   }, { container: container.value as HTMLDivElement } as any);

			// init map
			map.value           = markRaw(new MaplibreMap(opts));
			registryItem.map    = map.value;
			isInitialized.value = true;
			boundMapEvents.set('__load', () => (isLoaded.value = true, registryItem.isLoaded = true));
			map.value.once('styledata', onStyleReady);
			map.value.on('load', boundMapEvents.get('__load') as any);

			// bind events
			if (component.vnode.props) {
				for (let i = 0, len = MapLib.MAP_EVENT_TYPES.length; i < len; i++) {
					if (component.vnode.props[ 'onMap:' + MapLib.MAP_EVENT_TYPES[ i ] ]) {
						const handler = MapLib.createEventHandler(component as any, map.value, ctx as any, 'map:' + MapLib.MAP_EVENT_TYPES[ i ]);
						boundMapEvents.set(MapLib.MAP_EVENT_TYPES[ i ], handler);
						map.value.on(MapLib.MAP_EVENT_TYPES[ i ], handler);
					}
				}
			}

			// automatic re-initialization of map on CONTEXT_LOST_WEBGL
			map.value.getCanvas().addEventListener('webglcontextlost', restart);

		}

		async function dispose() {

			registryItem.isMounted = false;
			registryItem.isLoaded  = false;
			isLoaded.value         = false;

			if (map.value) {
				// unbind events
				map.value.getCanvas().removeEventListener('webglcontextlost', restart);
				map.value._controls.forEach((control) => {
					map.value!.removeControl(control);
				});
				isInitialized.value = false;
				boundMapEvents.forEach((func, en) => {
					map.value!.off(en.startsWith('__') ? en.substring(2) : en, func as any);
				});
				// destroy map
				map.value.remove();
			}

		}

		function restart() {
			dispose();
			nextTick(initialize);
		}

		/*
		 * init map
		 */
		onMounted(() => {

			initialize();

			// bind resize observer
			if (map.value) {
				resizeObserver = new ResizeObserver(debounce(map.value.resize.bind(map.value), 100));
				resizeObserver.observe(container.value as HTMLDivElement);
			}

		});

		/*
		 * Dispose component
		 */
		onBeforeUnmount(() => {

			// unbind resize observer
			if (resizeObserver !== undefined) {
				resizeObserver.disconnect();
				resizeObserver = undefined;
			}

			dispose();

		});

		ctx.expose({ map });

		return () => h(
			'div',
			{
				'class': 'mgl-container',
				style  : { height: props.height, width: props.width }
			},
			[
				h('div', { ref: container, 'class': 'mgl-wrapper' }),
				isInitialized.value && ctx.slots.default ? ctx.slots.default({}) : undefined
			]
		);

	}
});
