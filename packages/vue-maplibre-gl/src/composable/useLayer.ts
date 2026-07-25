import type { Source } from 'maplibre-gl';
import {
	inject,
	onScopeDispose,
	shallowRef,
	toValue,
	watch,
	type ComponentInternalInstance,
	type MaybeRefOrGetter,
	type ShallowRef
} from 'vue';
import { useMapContext, type MapOrRef } from 'composable/useMapContext';
import { LayerLib } from 'lib/layer.lib';
import { applyLayerDiff } from 'lib/layerDiff';
import { sourceIdSymbol, sourceLayerRegistry, type MglLayerKind, type MglLayerOptions } from 'types';

export interface UseLayerOptions<T extends MglLayerKind> {
	/** Layer id on the map. Read once; remount to change it. */
	layerId: string;
	/** Layer kind. Discriminates {@link options}. */
	type: T;
	/**
	 * The maplibre layer specification minus `id`, `type` and `source`. Reactive: pass a getter or ref
	 * and changes are applied to the live layer.
	 */
	options?: MaybeRefOrGetter<MglLayerOptions<T> | undefined>;
	/**
	 * Source id, or a maplibre `Source` instance. Optional when called inside a `useSource()` scope,
	 * which provides the id. Only a string id participates in source-readiness tracking.
	 */
	source?: string | Source;
	/** Insert the layer before this one. */
	before?: MaybeRefOrGetter<string | undefined>;
	/**
	 * The component instance whose vnode props carry the layer event handlers (`onClick`, …).
	 *
	 * maplibre needs the `(event, layerId, handler)` overload, which Vue's emit system cannot express, so
	 * handlers are read straight off the vnode. Pass `getCurrentInstance()` to get `@click` & co.; omit
	 * it and no layer events are bound, which is what you want when subscribing via `useLayerEvent`.
	 */
	instance?: ComponentInternalInstance | null;
	/**
	 * Work against this map instead of the enclosing `<MglMap>`. Shares the synthesised context with any
	 * `useSource({ map })` on the same map, so source-readiness tracking still works. See `useMapContext`.
	 */
	map?: MapOrRef;
}

export interface UseLayerReturn {
	/** `true` exactly while the layer is on the map. Treat as read-only. */
	isAdded: ShallowRef<boolean>;
	/** Adds the layer if it is not on the map yet. */
	add: () => void;
	/** Removes the layer if it is on the map. */
	remove: () => void;
}

/**
 * Adds a layer to the enclosing map once its source is ready, keeps it in sync with `options`, and
 * removes it again.
 *
 * This is the whole implementation — `<MglLayer>` is a thin wrapper around it:
 *
 * ```ts
 * useLayer({
 * 	layerId: 'quakes',
 * 	type: 'circle',
 * 	source: 'earthquakes',
 * 	options: () => ({ paint: { 'circle-radius': radius.value } }),
 * 	instance: getCurrentInstance()
 * });
 * ```
 *
 * Must be called in a component `setup()`: it registers teardown on the current scope and, if it is
 * inside a `useSource()` scope, hooks into that source's registry so the layer is removed **before** the
 * source — which maplibre requires.
 *
 * The source handle it waits on is tri-state: a `Source` means ready, `null` means wait (not added yet,
 * or torn down by a style switch), `undefined` means there is nothing to wait for.
 */
/*
 * One concrete overload per layer kind, plus a generic fallback — see the note on `useSource` for why:
 * while `T` is a type parameter, `MglLayerOptions<T>` cannot be evaluated, so an inline `options` literal
 * gets no contextual type and its `paint`/`layout` keys are not checked against the kind.
 */
export function useLayer(opts: UseLayerOptions<'fill'>): UseLayerReturn;
export function useLayer(opts: UseLayerOptions<'line'>): UseLayerReturn;
export function useLayer(opts: UseLayerOptions<'symbol'>): UseLayerReturn;
export function useLayer(opts: UseLayerOptions<'circle'>): UseLayerReturn;
export function useLayer(opts: UseLayerOptions<'heatmap'>): UseLayerReturn;
export function useLayer(opts: UseLayerOptions<'fill-extrusion'>): UseLayerReturn;
export function useLayer(opts: UseLayerOptions<'raster'>): UseLayerReturn;
export function useLayer(opts: UseLayerOptions<'hillshade'>): UseLayerReturn;
export function useLayer(opts: UseLayerOptions<'color-relief'>): UseLayerReturn;
export function useLayer(opts: UseLayerOptions<'background'>): UseLayerReturn;
export function useLayer<T extends MglLayerKind>(opts: UseLayerOptions<T>): UseLayerReturn;
export function useLayer<T extends MglLayerKind>(opts: UseLayerOptions<T>): UseLayerReturn {
	const { map, isLoaded, sourceRegistry: registry } = useMapContext(opts.map),
		layerRegistry = inject(sourceLayerRegistry, undefined),
		injectedSourceId = inject(sourceIdSymbol, undefined),
		{ layerId, type, instance } = opts,
		source = opts.source || injectedSourceId,
		sourceId = typeof source === 'string' ? source : undefined,
		sourceRef = registry.get(sourceId),
		appliedOptions = shallowRef<MglLayerOptions<T> | undefined>(undefined),
		isAdded = shallowRef(false);

	// `background` is the one layer kind the maplibre specification gives no source at all
	if (!source && type !== 'background') {
		throw new Error(`useLayer (${layerId}): needs a \`source\`, or must be called inside a useSource() scope.`);
	}

	function add() {
		if (!map.value || isAdded.value) {
			return;
		}
		const options = toValue(opts.options) ?? ({} as MglLayerOptions<T>);
		map.value.addLayer({ ...options, id: layerId, type, ...(source ? { source } : {}) } as never, toValue(opts.before));
		appliedOptions.value = { ...options };
		isAdded.value = true;
		if (instance) {
			LayerLib.registerLayerEvents(map.value, layerId, instance.vnode);
		}
	}

	function remove() {
		if (!map.value || !isAdded.value) {
			return;
		}
		if (instance) {
			LayerLib.unregisterLayerEvents(map.value, layerId, instance.vnode);
		}
		if (map.value.getLayer(layerId)) {
			map.value.removeLayer(layerId);
		}
		isAdded.value = false;
		appliedOptions.value = undefined;
	}

	watch(
		[isLoaded, sourceRef],
		([loaded, resolvedSource]) => {
			if (loaded && (resolvedSource || resolvedSource === undefined)) {
				add();
			} else {
				// the source went away (style switch); drop our handle so it can be re-added afterwards
				isAdded.value = false;
				appliedOptions.value = undefined;
			}
		},
		{ immediate: true }
	);

	watch(
		() => toValue(opts.options),
		next => {
			if (!map.value || !isAdded.value) {
				return;
			}
			const options = next ?? ({} as MglLayerOptions<T>);
			if (applyLayerDiff(map.value, layerId, appliedOptions.value, options)) {
				appliedOptions.value = { ...options };
			} else {
				// `source-layer` / `metadata` changed and maplibre has no setter for those
				remove();
				add();
			}
		},
		{ deep: true }
	);

	/**
	 * A style switch destroys every layer, and the layer has to put itself back.
	 *
	 * Watching the source handle is not enough: `styleSwitched` (which resets the handle to `null`) is only
	 * broadcast by `MglStyleSwitchControl`. A plain `map.setStyle()` — including a change to `MglMap`'s
	 * `mapStyle` prop, which goes through `applyMapOption` — fires `style.load` *without* it. The handle
	 * then goes straight from the old `Source` to the new one, `isAdded` is still `true` from before, and
	 * `add()` bails out: the source comes back but the layer is gone for good.
	 *
	 * The source's own `style.load` handler is registered first (parent setup runs before the child's), so
	 * by the time this runs the source is usually back. When it is not — a layer pointing at a source
	 * declared later in the tree — the `sourceRef` watcher below re-adds it once the source appears.
	 */
	const styleLoadSubscription = map.value!.on('style.load', () => {
		isAdded.value = false;
		appliedOptions.value = undefined;
		if (!sourceId || map.value?.getSource(sourceId)) {
			add();
		}
	});

	/** Lets the enclosing source tear its layers down before removing itself. */
	layerRegistry?.registerUnmountHandler(layerId, remove);

	onScopeDispose(() => {
		styleLoadSubscription.unsubscribe();
		layerRegistry?.unregisterUnmountHandler(layerId);
		remove();
	});

	return { isAdded, add, remove };
}
