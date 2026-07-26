import type { LayerSpecification, Map, MapLayerEventType, Source } from 'maplibre-gl';
import { unref, type PropType, type VNode } from 'vue';
import { keysOf, type AssertNever } from 'types/exhaustive';

/**
 * Distributive `keyof`: the union of keys across every member of a union type.
 *
 * `keyof (A | B)` yields only the keys A and B share, which is the opposite of what is needed here.
 */
type KeysOfUnion<T> = T extends unknown ? keyof T : never;

/**
 * Every key any layer specification can carry, minus the three the component owns
 * (`id` from `layerId`, `type` from the component, `source` from the prop or enclosing source).
 *
 * Resolves to `'metadata' | 'minzoom' | 'maxzoom' | 'filter' | 'layout' | 'paint' | 'source-layer'`.
 * Derived from the spec union rather than hand-written, so it covers `color-relief` — which the
 * previous nine-way intersection silently omitted — and picks up future layer types automatically.
 */
type LayerSpecKey = Exclude<KeysOfUnion<LayerSpecification>, 'id' | 'type' | 'source'>;

/** Same set, but with maplibre's `source-layer` under its camelCase prop name. */
export type LayerOptionProp = Exclude<LayerSpecKey, 'source-layer'> | 'sourceLayer';

/**
 * Payload type per layer event, as `defineEmits` needs it.
 *
 * Spelled out rather than derived with `{ [K in keyof MapLayerEventType]: … }`: Vue's SFC compiler has
 * its own, much more limited type resolver than tsc, and it cannot evaluate a mapped type over a type
 * imported from a `.d.ts` in node_modules — `vue-tsc` accepts it, but `vite build` fails in
 * `extractRuntimeEmits`, because the runtime emits array has to be generated at compile time.
 *
 * The literal is guarded by the two assertions below, so it cannot drift from maplibre.
 */
export interface MglLayerEmits {
	/** A feature of this layer was clicked. `ev.features` holds the features under the pointer. */
	click: [ev: MapLayerEventType['click']];
	/** A feature of this layer was double-clicked. */
	dblclick: [ev: MapLayerEventType['dblclick']];
	/** A mouse button went down over a feature of this layer. */
	mousedown: [ev: MapLayerEventType['mousedown']];
	/** A mouse button was released over a feature of this layer. */
	mouseup: [ev: MapLayerEventType['mouseup']];
	/** The pointer moved while over a feature of this layer. Fires often — throttle anything expensive. */
	mousemove: [ev: MapLayerEventType['mousemove']];
	/** The pointer entered a feature of this layer. The usual place to set a hover state. */
	mouseenter: [ev: MapLayerEventType['mouseenter']];
	/** The pointer left the features of this layer. */
	mouseleave: [ev: MapLayerEventType['mouseleave']];
	/** The pointer moved onto a feature of this layer, including from one feature to another. */
	mouseover: [ev: MapLayerEventType['mouseover']];
	/** The pointer moved off a feature of this layer. */
	mouseout: [ev: MapLayerEventType['mouseout']];
	/** The context menu was requested over a feature of this layer. */
	contextmenu: [ev: MapLayerEventType['contextmenu']];
	/** A touch started on a feature of this layer. */
	touchstart: [ev: MapLayerEventType['touchstart']];
	/** A touch ended on a feature of this layer. */
	touchend: [ev: MapLayerEventType['touchend']];
	/** A touch on a feature of this layer was cancelled by the browser. */
	touchcancel: [ev: MapLayerEventType['touchcancel']];
}

/**
 * Proves {@link MglLayerEmits} declares every layer event and no extra ones. Exported only to satisfy
 * `noUnusedLocals`; emits nothing.
 */
export type _LayerEmitsCoverEveryEvent = AssertNever<Exclude<keyof MapLayerEventType, keyof MglLayerEmits>>;

/** The other direction: no declared emit that maplibre does not have. */
export type _LayerEmitsHaveNoExtras = AssertNever<Exclude<keyof MglLayerEmits, keyof MapLayerEventType>>;

export class LayerLib {

	/**
	 * Prop names forwarded into `addLayer`.
	 *
	 * Proven complete against the layer specification union by `keysOf`: a new key in a future
	 * maplibre release stops this from compiling.
	 *
	 * `ref` and `interactive` were in the previous list but are **not** layer specification keys in
	 * maplibre at all — `ref` was dead (no matching prop) and `interactive` was forwarded into
	 * `addLayer` as an unknown property. Both are gone; see the deprecated `interactive` prop below.
	 */
	static readonly LAYER_OPTION_KEYS = keysOf<Record<LayerOptionProp, unknown>>({
		filter: 0,
		layout: 0,
		maxzoom: 0,
		metadata: 0,
		minzoom: 0,
		paint: 0,
		sourceLayer: 0
	});

	/** Every event a layer can fire, exhaustive against `MapLayerEventType`. */
	static readonly LAYER_EVENTS = keysOf<MapLayerEventType>({
		click: 0,
		contextmenu: 0,
		dblclick: 0,
		mousedown: 0,
		mouseenter: 0,
		mouseleave: 0,
		mousemove: 0,
		mouseout: 0,
		mouseover: 0,
		mouseup: 0,
		touchcancel: 0,
		touchend: 0,
		touchstart: 0
	});

	/*
	 * Documented once here, and inherited by all ten named layer wrappers — including into their
	 * generated API tables and `web-types.json` entries.
	 */
	static readonly SHARED = {
		props: {
			/** Layer id on the map. Must be unique across the style. */
			layerId: {
				type: String as PropType<string>,
				required: true
			},

			/**
			 * Source id, or a maplibre `Source` instance.
			 *
			 * Optional inside an `<MglSource>` (or any component using `useSource()`), which provides its
			 * id. Only a string id participates in source-readiness tracking — pass a `Source` object and
			 * the layer adds itself immediately.
			 */
			source: [String, Object] as PropType<string | Source>,

			/** Arbitrary data carried on the layer. Has no maplibre setter, so changing it recreates the layer. */
			metadata: [Object, Array, String, Number] as PropType<any>,

			/**
			 * Layer within a vector source to draw. Required for vector and some raster-dem sources.
			 *
			 * Mapped to maplibre's `source-layer`, which is not a valid identifier. Has no setter either,
			 * so changing it recreates the layer.
			 */
			sourceLayer: String as PropType<string>,

			/** Hide the layer below this zoom level. Applied through `setLayerZoomRange`. */
			minzoom: Number as PropType<number>,

			/** Hide the layer at and above this zoom level. Applied through `setLayerZoomRange`. */
			maxzoom: Number as PropType<number>,
			/**
			 * @deprecated Never had any effect: `interactive` is not part of the maplibre layer
			 * specification, and it used to be forwarded into `addLayer` as an unknown property.
			 * It is now ignored. Bind layer events (`@click`, `@mouseenter`, …) instead.
			 */
			interactive: Boolean as PropType<boolean>,

			/** Insert this layer beneath the layer with this id. Without it, layers are appended in mount order. */
			before: String as PropType<string>
		},
		/** Derived from {@link LAYER_EVENTS} instead of duplicating the list. */
		emits: LayerLib.LAYER_EVENTS
	};

	/**
	 * Collects the flat props of a named layer wrapper (`MglFillLayer` & co.) into the `options` object
	 * the generic `MglLayer` takes, renaming `sourceLayer` to maplibre's `source-layer`.
	 *
	 * Only keys that are actually set are copied, so an absent prop stays absent in the layer
	 * specification rather than becoming an explicit `undefined`.
	 */
	static pickLayerOptions(props: Record<string, unknown>): Record<string, unknown> {

		const options: Record<string, unknown> = {};
		for (const key of LayerLib.LAYER_OPTION_KEYS) {
			const value = unref(props[key]);
			if (value !== undefined) {
				options[key === 'sourceLayer' ? 'source-layer' : key] = value;
			}
		}
		return options;

	}

	static genLayerOpts<T = LayerSpecification>(id: string, type: string, props: any, source: any): T {

		return Object.keys(props)
			.filter(opt => props[opt] !== undefined && (LayerLib.LAYER_OPTION_KEYS as readonly string[]).includes(opt))
			.reduce(
				(obj, opt) => {
					(obj as any)[opt === 'sourceLayer' ? 'source-layer' : opt] = unref(props[opt]);
					return obj;
				},
				{ type, source: props.source || source, id } as T
			);

	}

	/**
	 * maplibre needs the `(event, layerId, handler)` signature, which Vue's emit system cannot
	 * produce, so handlers are read straight off the vnode props.
	 */
	private static eachLayerEventHandler(vn: VNode, fn: (event: keyof MapLayerEventType, handler: any) => void) {

		if (!vn.props) {
			return;
		}

		for (const event of LayerLib.LAYER_EVENTS) {
			const handler = vn.props[`on${event.charAt(0).toUpperCase()}${event.slice(1)}`];
			if (handler) {
				fn(event, handler);
			}
		}

	}

	static registerLayerEvents(map: Map, layerId: string, vn: VNode) {
		LayerLib.eachLayerEventHandler(vn, (event, handler) => map.on(event, layerId, handler));
	}

	static unregisterLayerEvents(map: Map, layerId: string, vn: VNode) {
		LayerLib.eachLayerEventHandler(vn, (event, handler) => map.off(event, layerId, handler));
	}

}
