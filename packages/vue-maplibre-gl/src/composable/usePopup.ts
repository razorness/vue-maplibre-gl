import { Popup, type LngLatLike, type PopupOptions } from 'maplibre-gl';
import {
	computed,
	inject,
	onScopeDispose,
	shallowRef,
	toValue,
	watch,
	type ComputedRef,
	type MaybeRefOrGetter,
	type ShallowRef
} from 'vue';
import { useMapContext, type MapOrRef } from 'composable/useMapContext';
import { markerSymbol } from 'types';

export interface UsePopupOptions {
	/**
	 * Where the popup points.
	 *
	 * Optional when attached to a marker (the marker's position wins) or when `trackPointer` is on.
	 */
	lngLat?: MaybeRefOrGetter<LngLatLike | undefined>;
	/** maplibre popup options. Reactive where maplibre has a setter (`maxWidth`, `offset`). */
	options?: MaybeRefOrGetter<PopupOptions>;
	/**
	 * Element holding the popup content. Read once — maplibre takes the node and manages it from there.
	 * `<MglPopup>` creates one and teleports its slot into it.
	 */
	element?: HTMLElement;
	/** Plain text content, if you are not supplying an element. */
	text?: MaybeRefOrGetter<string | undefined>;
	/** Controls visibility. Leave it out and the popup is added immediately and stays. */
	open?: MaybeRefOrGetter<boolean | undefined>;
	/** Follow the cursor instead of sticking to a coordinate. */
	trackPointer?: MaybeRefOrGetter<boolean | undefined>;
	onOpen?: (popup: Popup) => void;
	onClose?: (popup: Popup) => void;
	/** Work against this map instead of the enclosing `<MglMap>`. */
	map?: MapOrRef;
}

export interface UsePopupReturn {
	popup: ShallowRef<Popup | undefined>;
	/** Whether maplibre currently has the popup on the map. */
	isOpen: ComputedRef<boolean>;
	open: () => void;
	close: () => void;
}

/**
 * Creates a maplibre popup and keeps it in sync.
 *
 * This is the whole implementation of `<MglPopup>`. When called inside a `useMarker()` scope it attaches
 * to that marker via `marker.setPopup()` instead of adding itself to the map, so the marker's own click
 * handling toggles it — that is what makes `<MglPopup>` nested in `<MglMarker>` do the obvious thing.
 *
 * ```ts
 * const { popup, isOpen } = usePopup({
 * 	lngLat: () => selected.value?.coordinates,
 * 	open: () => Boolean(selected.value),
 * 	options: () => ({ closeButton: false, offset: 12 })
 * });
 * ```
 */
export function usePopup(opts: UsePopupOptions): UsePopupReturn {
	const { map } = useMapContext(opts.map),
		/* undefined when not nested in a marker */
		marker = inject(markerSymbol, undefined),
		popup = shallowRef<Popup>(),
		isAttachedToMarker = Boolean(marker),
		instance = new Popup(toValue(opts.options));

	popup.value = instance;

	if (opts.element) {
		instance.setDOMContent(opts.element);
	}

	function open() {
		if (isAttachedToMarker || instance.isOpen()) {
			return;
		}
		instance.addTo(map.value!);
	}

	function close() {
		if (isAttachedToMarker) {
			return;
		}
		instance.remove();
	}

	instance.on('open', () => opts.onOpen?.(instance));
	instance.on('close', () => opts.onClose?.(instance));

	if (marker) {
		/*
		 * A marker-attached popup must not be added to the map itself — maplibre toggles it from the
		 * marker. Wait for the marker to exist, since `useMarker` fills its ref during its own setup.
		 */
		watch(marker, m => m?.setPopup(instance), { immediate: true });
	}

	watch(
		() => toValue(opts.lngLat),
		v => v && instance.setLngLat(v),
		{ immediate: true }
	);

	watch(
		() => toValue(opts.text),
		v => v !== undefined && instance.setText(v),
		{ immediate: true }
	);

	watch(
		() => toValue(opts.trackPointer),
		v => v && instance.trackPointer(),
		{ immediate: true }
	);

	/* only `maxWidth` and `offset` have setters; the rest are constructor-only in maplibre */
	watch(
		() => toValue(opts.options) ?? {},
		next => {
			if (next.maxWidth !== undefined) {
				instance.setMaxWidth(next.maxWidth);
			}
			if (next.offset !== undefined) {
				instance.setOffset(next.offset);
			}
		},
		{ deep: true }
	);

	watch(
		() => toValue(opts.open),
		v => {
			// `undefined` means uncontrolled: add it once and leave it alone
			if (v === undefined) {
				open();
			} else if (v) {
				open();
			} else {
				close();
			}
		},
		{ immediate: true }
	);

	onScopeDispose(() => {
		instance.remove();
		popup.value = undefined;
	});

	return {
		popup,
		isOpen: computed(() => Boolean(popup.value?.isOpen())),
		open,
		close
	};
}
