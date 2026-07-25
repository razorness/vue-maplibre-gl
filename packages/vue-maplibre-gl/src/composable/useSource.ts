import type { Source } from 'maplibre-gl';
import { computed, onScopeDispose, provide, shallowRef, toValue, watch, type ComputedRef, type MaybeRefOrGetter } from 'vue';
import { useMapContext, type MapOrRef } from 'composable/useMapContext';
import { applySourceDiff } from 'lib/sourceDiff';
import { SourceLayerRegistry } from 'lib/sourceLayer.registry';
import type { SourceRef } from 'lib/sourceRegistry';
import { sourceIdSymbol, sourceLayerRegistry, type MglSourceKind, type MglSourceOptions } from 'types';

export interface UseSourceOptions<T extends MglSourceKind> {
	/**
	 * Id the source is registered under.
	 *
	 * Read once. Changing the id of a live source is not supported — unmount and remount instead, which
	 * is what `<MglSource :key="id">` does for you.
	 */
	sourceId: string;
	/** Source kind. Discriminates {@link options}. */
	type: T;
	/**
	 * The maplibre source specification minus `type`. Reactive: pass a getter or ref and changes are
	 * applied to the live source with the narrowest available setter.
	 */
	options: MaybeRefOrGetter<MglSourceOptions<T>>;
	/**
	 * Work against this map instead of the enclosing `<MglMap>`.
	 *
	 * Lets the composable run on a map this library did not create. The pieces `<MglMap>` would have
	 * provided are synthesised and **shared per map**, so a `useLayer({ map })` on the same map still sees
	 * this source become ready. See `useMapContext`.
	 */
	map?: MapOrRef;
}

export interface UseSourceReturn {
	/**
	 * Tri-state handle on the source: a `Source` once it is on the map, `null` while pending or after a
	 * style switch tore it down, `undefined` when nothing is being tracked.
	 */
	source: SourceRef;
	/** `true` exactly while the source exists on the map. Convenient for gating child content. */
	isReady: ComputedRef<boolean>;
	/** Registry the nested layers register their teardown with. Also provided down the tree. */
	layerRegistry: SourceLayerRegistry;
	/** Removes the source (layers first) and adds it again from the current options. */
	recreate: () => void;
}

/**
 * Adds a source to the enclosing map, keeps it in sync with `options`, and tears it down again.
 *
 * This is the whole implementation — `<MglSource>` is a thin wrapper around it, so anything the
 * component can do you can do in your own component:
 *
 * ```ts
 * const { source, isReady } = useSource({
 * 	sourceId: 'earthquakes',
 * 	type: 'geojson',
 * 	options: () => ({ data: data.value, cluster: true })
 * });
 * ```
 *
 * Must be called in a component `setup()`: it `provide()`s the source id and the layer registry so
 * nested layers bind to this source automatically, and it registers teardown on the current scope.
 *
 * What it handles for you:
 *
 * - adds the source once the map's style is loaded, and again on every `style.load`
 * - resets its handle on `styleSwitched`, so layers wait instead of touching a source that is gone
 * - diffs `options` onto the live source, falling back to remove + re-add where maplibre has no setter
 * - removes nested layers **before** the source, which maplibre requires
 * - reports failures from the async v6 setters on the map's `error` event instead of dropping them
 */
/*
 * Deliberately declared as one concrete overload per source kind, plus a generic fallback.
 *
 * With only the generic signature, `options` has the contextual type `MglSourceOptions<T>` — and while `T`
 * is still a type *parameter*, the `Extract<Union, { type: T }>` inside it cannot be evaluated. TypeScript
 * therefore has no usable contextual type for an inline `options` literal, infers it bare, and widens
 * `type: 'FeatureCollection'` to `string`, so the literal no longer matches GeoJSON:
 *
 *   useSource({ type: 'geojson', options: () => ({ data: { type: 'FeatureCollection', … } }) })
 *   //                                              ^ Type 'string' is not assignable to …
 *
 * Once the overload is concrete, `MglSourceOptions<'geojson'>` is a real type and the literal narrows.
 * Wrong options are still rejected, and the trailing generic overload keeps a dynamically computed kind
 * (`const kind: MglSourceKind = …`) callable.
 */
export function useSource(opts: UseSourceOptions<'geojson'>): UseSourceReturn;
export function useSource(opts: UseSourceOptions<'vector'>): UseSourceReturn;
export function useSource(opts: UseSourceOptions<'raster'>): UseSourceReturn;
export function useSource(opts: UseSourceOptions<'raster-dem'>): UseSourceReturn;
export function useSource(opts: UseSourceOptions<'image'>): UseSourceReturn;
export function useSource(opts: UseSourceOptions<'video'>): UseSourceReturn;
export function useSource(opts: UseSourceOptions<'canvas'>): UseSourceReturn;
export function useSource<T extends MglSourceKind>(opts: UseSourceOptions<T>): UseSourceReturn;
export function useSource<T extends MglSourceKind>(opts: UseSourceOptions<T>): UseSourceReturn {
	const { map, isLoaded, emitter, sourceRegistry: registry } = useMapContext(opts.map),
		{ sourceId, type } = opts,
		source = registry.get(sourceId),
		layerRegistry = new SourceLayerRegistry(),
		/** Snapshot of the options as last handed to maplibre, for diffing. */
		appliedOptions = shallowRef<MglSourceOptions<T> | undefined>(undefined);

	provide(sourceIdSymbol, sourceId);
	provide(sourceLayerRegistry, layerRegistry);

	function addSource() {
		if (!isLoaded.value || !map.value || map.value.getSource(sourceId)) {
			return;
		}
		const options = toValue(opts.options);
		map.value.addSource(sourceId, { type, ...options } as never);
		appliedOptions.value = { ...options };
		registry.set(sourceId, map.value.getSource(sourceId) as Source);
	}

	function removeSource() {
		if (!isLoaded.value || !map.value) {
			return;
		}
		// layers first: maplibre refuses to remove a source that still has layers on it
		layerRegistry.unmount();
		if (map.value.getSource(sourceId)) {
			map.value.removeSource(sourceId);
		}
		registry.set(sourceId, null);
		appliedOptions.value = undefined;
	}

	function recreate() {
		removeSource();
		addSource();
	}

	/**
	 * A style switch throws every source away (`setStyle` runs with `diff: false`), so the handle goes
	 * back to pending here and the source is re-added on the following `style.load`.
	 */
	function onStyleSwitched() {
		registry.set(sourceId, null);
		appliedOptions.value = undefined;
	}

	watch(isLoaded, addSource, { immediate: true });
	const styleLoadSubscription = map.value!.on('style.load', addSource);
	emitter.on('styleSwitched', onStyleSwitched);

	watch(
		() => toValue(opts.options),
		next => {
			if (!source.value || !map.value) {
				return;
			}
			const { applied, pending } = applySourceDiff(type, source.value, appliedOptions.value, next);

			if (!applied) {
				recreate();
				return;
			}

			appliedOptions.value = { ...next };
			for (const promise of pending) {
				promise.catch((error: unknown) => map.value?.fire('error', { error }));
			}
		},
		{ deep: true }
	);

	onScopeDispose(() => {
		removeSource();
		registry.delete(sourceId);
		styleLoadSubscription.unsubscribe();
		emitter.off('styleSwitched', onStyleSwitched);
	});

	return {
		source,
		isReady: computed(() => Boolean(source.value)),
		layerRegistry,
		recreate
	};
}
