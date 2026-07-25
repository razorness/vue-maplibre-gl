import { Map as MaplibreMap, type MapEventType, type MapOptions, type ProjectionSpecification, type Subscription } from 'maplibre-gl';
import mitt, { type Emitter } from 'mitt';
import {
	getCurrentInstance,
	markRaw,
	nextTick,
	onBeforeUnmount,
	onMounted,
	onUnmounted,
	provide,
	ref,
	shallowRef,
	toValue,
	watch,
	type MaybeRefOrGetter,
	type Ref,
	type ShallowRef
} from 'vue';
import { useCameraModel, type CameraModelBinding } from 'composable/useCameraModel';
import { ControlRegistry } from 'lib/controlRegistry';
import { debounce } from 'lib/debounce';
import { setPrimaryLanguage } from 'lib/language';
import { applyMapDiff } from 'lib/mapDiff';
import { registerMap, unregisterMap, type MapInstance } from 'lib/mapRegistry';
import { MglSourceRegistry } from 'lib/sourceRegistry';
import {
	componentIdSymbol,
	controlRegistrySymbol,
	emitterSymbol,
	fitBoundsOptionsSymbol,
	isInitializedSymbol,
	isLoadedSymbol,
	mapSymbol,
	sourceIdSymbol,
	sourceRegistrySymbol,
	type FitBoundsOptions,
	type MglEvent,
	type MglEvents,
	type ValidLanguages
} from 'types';

/** The maplibre map options, minus the container this composable owns. */
export type MglMapOptions = Omit<MapOptions, 'container'>;

export interface UseMglMapOptions {
	/**
	 * Element the map renders into. May start out empty — the map is created in `onMounted`, by which
	 * time a template ref has resolved.
	 */
	container: MaybeRefOrGetter<HTMLElement | null | undefined>;
	/**
	 * maplibre map options. Reactive: options with a setter are applied to the live map (see
	 * `lib/mapDiff.ts`); the rest are read once when the map is created.
	 */
	options: MaybeRefOrGetter<MglMapOptions>;
	/** Key this map is registered under in the global registry, for `useMap(key)`. */
	mapKey?: string | symbol;
	/** Rewrites every symbol layer's `text-field` to this language. */
	language?: MaybeRefOrGetter<ValidLanguages | undefined>;
	/** Shared with the draw plugin for viewport padding, and used for `bounds` updates. */
	fitBoundsOptions?: MaybeRefOrGetter<FitBoundsOptions | undefined>;
	/**
	 * Map projection, e.g. `{ type: 'globe' }`.
	 *
	 * Its own option rather than part of {@link options}: `projection` is not a `MapOptions` key at all
	 * but a style-level setting, applied through `setProjection` once the style is ready.
	 */
	projection?: MaybeRefOrGetter<ProjectionSpecification | undefined>;
	/**
	 * Map events to subscribe to, and where to send them.
	 *
	 * `MglMap` passes only the events the consumer actually bound a listener for, so unused events cost
	 * nothing. Omit this and no map events are forwarded — use `useMapEvent()` instead.
	 */
	events?: ReadonlyArray<keyof MapEventType>;
	/** Receives every event named in {@link events}. */
	onEvent?: (event: keyof MapEventType, payload: MglEvent) => void;
	/** Two-way camera binding. `MglMap` wires this to its `update:*` emits. */
	camera?: CameraModelBinding;
	/** Keep the map sized to its container. Defaults to `true`. */
	observeResize?: boolean;
}

export interface UseMglMapReturn {
	/** The maplibre map. `undefined` until mounted, and again between dispose and re-initialise. */
	map: ShallowRef<MaplibreMap | undefined>;
	/** The map object exists. Children may assume `map.value` is set. */
	isInitialized: Ref<boolean>;
	/** maplibre fired `load`. Sources and layers gate on this. */
	isLoaded: Ref<boolean>;
	emitter: Emitter<MglEvents>;
	sourceRegistry: MglSourceRegistry;
	controlRegistry: ControlRegistry;
	/** The entry in the global map registry, i.e. what `useMap(key)` returns. */
	registryItem: MapInstance;
	/** Tears the map down and builds it again. Used for WebGL context loss. */
	restart: () => void;
	dispose: () => void;
}

/**
 * Creates a maplibre map, keeps it in sync with its options, and provides everything the source, layer
 * and marker composables inject.
 *
 * This is the whole implementation of `<MglMap>`, which is a thin wrapper mapping its flat props onto
 * `options`. Use it directly when you want the map lifecycle without this library's component — you own
 * the container element and the template, and everything below still works:
 *
 * ```ts
 * const container = useTemplateRef<HTMLDivElement>('map');
 * useMglMap({ container, options: () => ({ style, center: center.value, zoom: zoom.value }) });
 * // <MglSource>/<MglLayer>/useSource()/useLayer() in this subtree now work
 * ```
 *
 * Handles: creation on mount, the provide spine, reactive option updates, language rewriting, resetting
 * source handles on a style switch, resizing with the container, full teardown and rebuild on WebGL
 * context loss, and registration in the global map registry.
 */
export function useMglMap(opts: UseMglMapOptions): UseMglMapReturn {
	const instance = getCurrentInstance(),
		map = shallowRef<MaplibreMap>(),
		isInitialized = ref(false),
		isLoaded = ref(false),
		/** Distinct from `isLoaded`: the first `styledata` arrives before `load`. */
		isStyleReady = ref(false),
		/*
		 * v6 `Map.on()` returns a `Subscription`, so teardown needs no name->handler bookkeeping.
		 * That replaced a `Map<string, Function>` with a `'__load'` sentinel key that had to be
		 * stripped back off with `substring(2)` on dispose.
		 */
		subscriptions: Subscription[] = [],
		emitter = mitt<MglEvents>(),
		/* per-map, so source handles are collected with the map instead of leaking globally */
		sourceRegistry = new MglSourceRegistry(),
		/* lets dispose() remove exactly the controls this library added, not `map._controls` */
		controlRegistry = new ControlRegistry(),
		registryItem = registerMap(instance as never, map, opts.mapKey),
		camera =
			opts.camera ??
			useCameraModel(
				() => undefined,
				() => false
			);

	/** Snapshot of the options as last handed to maplibre, for diffing. */
	let appliedOptions: Record<string, unknown> = {};
	let resizeObserver: ResizeObserver | undefined;

	provide(mapSymbol, map);
	provide(isLoadedSymbol, isLoaded);
	provide(isInitializedSymbol, isInitialized);
	provide(componentIdSymbol, instance?.uid ?? 0);
	provide(sourceIdSymbol, '');
	provide(emitterSymbol, emitter);
	provide(fitBoundsOptionsSymbol, toValue(opts.fitBoundsOptions) ?? {});
	provide(sourceRegistrySymbol, sourceRegistry);
	provide(controlRegistrySymbol, controlRegistry);

	/*
	 * A style switch throws every source and layer away. Resetting the whole registry here means layers
	 * stop touching sources that no longer exist, and re-add themselves once `style.load` re-created them.
	 */
	emitter.on('styleSwitched', () => sourceRegistry.resetAll());

	function applyLanguage(language: ValidLanguages | undefined) {
		if (isStyleReady.value && map.value) {
			setPrimaryLanguage(map.value, language);
		}
	}

	function onStyleReady() {
		isStyleReady.value = true;
		applyProjection(toValue(opts.projection));
	}

	function applyProjection(projection: ProjectionSpecification | undefined) {
		if (projection && isStyleReady.value && map.value) {
			map.value.setProjection(projection);
		}
	}

	function onStyleLoad() {
		applyLanguage(registryItem.language);
	}

	function initialize() {
		const container = toValue(opts.container);
		/* v8 ignore next 3 -- guard for a caller that mounts without a container */
		if (!container) {
			return;
		}

		registryItem.isMounted = true;

		const options = { ...toValue(opts.options) };
		appliedOptions = { ...options };
		map.value = markRaw(new MaplibreMap({ ...options, container }));
		registryItem.map = map.value;
		isInitialized.value = true;

		// maplibre types once() as `this | Promise<any>` even when a listener is given
		void map.value.once('styledata', onStyleReady);
		subscriptions.push(
			map.value.on('load', () => {
				isLoaded.value = true;
				registryItem.isLoaded = true;
			}),
			map.value.on('style.load', onStyleLoad),
			...camera.bind(map.value)
		);

		for (const event of opts.events ?? []) {
			const listener = (payload: unknown) => {
				opts.onEvent?.(event, {
					type: (payload as { type?: string })?.type ?? event,
					map: map.value!,
					component: instance?.proxy as never,
					event: payload
				});
			};
			subscriptions.push(map.value.on(event, listener as never));
		}

		// automatic re-initialisation on CONTEXT_LOST_WEBGL
		map.value.getCanvas().addEventListener('webglcontextlost', restart);
	}

	/*
	 * Deliberately synchronous: nothing here awaits, and `restart()` relies on dispose having fully
	 * completed before `initialize` runs on the next tick.
	 */
	function dispose() {
		registryItem.isMounted = false;
		registryItem.isLoaded = false;
		isLoaded.value = false;
		isStyleReady.value = false;

		if (map.value) {
			for (const subscription of subscriptions) {
				subscription.unsubscribe();
			}
			subscriptions.length = 0;
			map.value.getCanvas().removeEventListener('webglcontextlost', restart);
			controlRegistry.removeAll(map.value);
			isInitialized.value = false;
			map.value.remove();
			map.value = undefined;
		}
	}

	function restart() {
		dispose();
		void nextTick(initialize);
	}

	/** Options with a maplibre setter are applied live; the rest only matter at construction. */
	watch(
		() => toValue(opts.options),
		next => {
			if (!map.value) {
				return;
			}
			const snapshot = { ...next };
			applyMapDiff(map.value, appliedOptions, snapshot, {
				fitBoundsOptions: toValue(opts.fitBoundsOptions),
				markProgrammatic: camera.markProgrammatic
			});
			appliedOptions = snapshot;
		},
		{ deep: true }
	);

	const initialLanguage = toValue(opts.language);
	if (initialLanguage) {
		registryItem.language = initialLanguage;
	}

	/* the prop and the registry entry may both drive the language, so both are watched */
	watch(
		() => toValue(opts.language),
		v => {
			if (registryItem.language !== (v || undefined)) {
				applyLanguage(v);
				registryItem.language = v || undefined;
			}
		}
	);
	watch(() => registryItem.language, applyLanguage);
	watch(() => toValue(opts.projection), applyProjection);

	onMounted(() => {
		initialize();

		if (map.value && opts.observeResize !== false) {
			/*
			 * Must swallow the ResizeObserver arguments. Passing `map.resize` directly meant maplibre was
			 * called as `resize(entries, observer)`, so the entry array leaked into the
			 * `movestart`/`move`/`resize`/`moveend` event payloads and the observer itself arrived as
			 * `constrainTransform`.
			 */
			resizeObserver = new ResizeObserver(debounce(() => map.value?.resize(), 100));
			resizeObserver.observe(toValue(opts.container)!);
		}
	});

	/*
	 * `onUnmounted`, not `onBeforeUnmount`: Vue runs `beforeUnmount` parent-first, so disposing here would
	 * destroy the map *before* the nested sources and layers get a chance to tear themselves down — their
	 * cleanup bails out on a missing `map.value`, leaving the removal order untested and unenforced.
	 * `onUnmounted` runs after the children are gone, so by then every layer has been removed from its
	 * source and every source from the map, in that order.
	 */
	onBeforeUnmount(() => {
		resizeObserver?.disconnect();
		resizeObserver = undefined;
	});

	onUnmounted(() => {
		dispose();
		unregisterMap(opts.mapKey);
	});

	return { map, isInitialized, isLoaded, emitter, sourceRegistry, controlRegistry, registryItem, restart, dispose };
}
