import { Marker, type LngLatLike, type MarkerOptions } from 'maplibre-gl';
import { onScopeDispose, provide, shallowRef, toValue, watch, type MaybeRefOrGetter, type ShallowRef } from 'vue';
import { useMapContext, type MapOrRef } from 'composable/useMapContext';
import { MapLib } from 'lib/map.lib';
import { markerSymbol } from 'types';

/** Marker options this library keeps reactive; `element` is set once at construction. */
export type MglMarkerOptions = Omit<MarkerOptions, 'element'>;

export interface UseMarkerOptions {
	/** Marker position. */
	lngLat: MaybeRefOrGetter<LngLatLike>;
	/** maplibre marker options, minus `element`. Reactive where maplibre has a setter. */
	options?: MaybeRefOrGetter<MglMarkerOptions>;
	/**
	 * Custom marker DOM. Read once, because maplibre bakes the element into the marker at construction.
	 * Leave it out to get maplibre's default pin.
	 */
	element?: HTMLElement;
	/** Fired continuously while dragging. */
	onDrag?: (marker: Marker) => void;
	onDragStart?: (marker: Marker) => void;
	/** Also the right place to read the settled position (`marker.getLngLat()`). */
	onDragEnd?: (marker: Marker) => void;
	onClick?: (marker: Marker) => void;
	/** Work against this map instead of the enclosing `<MglMap>`. */
	map?: MapOrRef;
}

export interface UseMarkerReturn {
	marker: ShallowRef<Marker | undefined>;
}

/**
 * Adds a marker to the map and keeps it in sync.
 *
 * This is the whole implementation of `<MglMarker>`. It also `provide()`s the marker, which is how a
 * nested `usePopup()` / `<MglPopup>` knows to attach to this marker rather than to the map.
 *
 * ```ts
 * const { marker } = useMarker({
 * 	lngLat: () => position.value,
 * 	options: () => ({ draggable: true, color: '#c00' }),
 * 	onDragEnd: m => (position.value = m.getLngLat())
 * });
 * ```
 *
 * Reactive: `lngLat`, plus every option maplibre exposes a setter for — `draggable`, `offset`,
 * `rotation`, `pitchAlignment`, `rotationAlignment`, `opacity`/`opacityWhenCovered` and
 * `subpixelPositioning`. The rest (`color`, `scale`, `anchor`, `clickTolerance`, `className`) are
 * constructor-only in maplibre and are read once.
 */
export function useMarker(opts: UseMarkerOptions): UseMarkerReturn {
	const { map } = useMapContext(opts.map),
		marker = shallowRef<Marker>();

	provide(markerSymbol, marker);

	const initial = toValue(opts.options) ?? {},
		constructorOptions: MarkerOptions = Object.fromEntries(
			Object.entries(initial).filter(
				([key, value]) => value !== undefined && (MapLib.MARKER_OPTION_KEYS as readonly string[]).includes(key)
			)
		);

	if (opts.element) {
		constructorOptions.element = opts.element;
	}

	const instance = new Marker(constructorOptions);
	instance.setLngLat(toValue(opts.lngLat)).addTo(map.value!);
	marker.value = instance;

	/*
	 * v6 gives Marker a typed event map (`MarkerEventType`). `drag` fires continuously, which is why the
	 * component only turns `dragend` into an `update:lngLat` — emitting on every frame would push a new
	 * value into the parent ~60 times a second and fight the marker's own position.
	 */
	instance.on('dragstart', () => opts.onDragStart?.(instance));
	instance.on('drag', () => opts.onDrag?.(instance));
	instance.on('dragend', () => opts.onDragEnd?.(instance));
	instance.on('click', () => opts.onClick?.(instance));

	watch(
		() => toValue(opts.lngLat),
		v => instance.setLngLat(v)
	);

	watch(
		() => toValue(opts.options) ?? {},
		next => {
			instance.setDraggable(next.draggable ?? false);
			instance.setOffset(next.offset ?? [0, 0]);
			instance.setRotation(next.rotation ?? 0);
			instance.setPitchAlignment(next.pitchAlignment ?? 'auto');
			instance.setRotationAlignment(next.rotationAlignment ?? 'auto');
			instance.setOpacity(next.opacity, next.opacityWhenCovered);
			instance.setSubpixelPositioning(next.subpixelPositioning ?? false);
		},
		{ deep: true, immediate: true }
	);

	onScopeDispose(() => {
		instance.remove();
		marker.value = undefined;
	});

	return { marker };
}
