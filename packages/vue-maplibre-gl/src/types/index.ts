import type { Map, MapOptions, Marker, SourceSpecification, StyleSpecification } from 'maplibre-gl';
import type { Emitter } from 'mitt';
import type { ComponentPublicInstance, InjectionKey, Ref, ShallowRef } from 'vue';
import type { ControlRegistry } from 'lib/controlRegistry';
import type { SourceLayerRegistry } from 'lib/sourceLayer.registry';
import type { MglSourceRegistry } from 'lib/sourceRegistry';

export * from 'types/exhaustive';
export * from 'types/layer';
export * from 'types/source';

export const mapSymbol = Symbol('map') as InjectionKey<ShallowRef<Map | undefined>>,
	isLoadedSymbol = Symbol('isLoaded') as InjectionKey<Ref<boolean>>,
	isInitializedSymbol = Symbol('isInitialized') as InjectionKey<Ref<boolean>>,
	componentIdSymbol = Symbol('componentId') as InjectionKey<number>,
	sourceIdSymbol = Symbol('sourceId') as InjectionKey<string>,
	sourceLayerRegistry = Symbol('sourceLayerRegistry') as InjectionKey<SourceLayerRegistry>,
	emitterSymbol = Symbol('emitter') as InjectionKey<Emitter<MglEvents>>,
	fitBoundsOptionsSymbol = Symbol('fitBoundsOptions') as InjectionKey<FitBoundsOptions>,
	/**
	 * Per-map source handle registry. Replaces the module-global `SourceLib.REFS`, so handles are
	 * scoped to one map and collected with it.
	 */
	sourceRegistrySymbol = Symbol('sourceRegistry') as InjectionKey<MglSourceRegistry>,
	/**
	 * The enclosing marker, so a nested `MglPopup` attaches itself to it instead of to the map.
	 */
	markerSymbol = Symbol('marker') as InjectionKey<ShallowRef<Marker | undefined>>,
	/**
	 * Controls added by control components, so `MglMap.dispose()` can remove exactly those instead of
	 * reaching into the private `map._controls`.
	 */
	controlRegistrySymbol = Symbol('controlRegistry') as InjectionKey<ControlRegistry>;

export type FitBoundsOptions = MapOptions['fitBoundsOptions'] & { useOnBoundsUpdate?: boolean };

/**
 * Payload of every `map:*` event emitted by `MglMap`.
 *
 * `component` is kept generic instead of hard-referencing `InstanceType<typeof MglMap>`: that
 * created a `types.ts` <-> `components/map.component.ts` import cycle. `MglMap` narrows the
 * parameter when it emits, so consumers still see the concrete instance type.
 */
export interface MglEvent<T = any, C extends ComponentPublicInstance = ComponentPublicInstance> {
	type: string;
	component: C;
	map: Map;
	event: T;
}

export type MglEvents = {
	styleSwitched: StyleSwitchItem;
};

export interface StyleSwitchItem {
	name: string;
	label: string;
	icon?: {
		path: string;
	};
	style: StyleSpecification | string;
}

/**
 * @deprecated Use {@link ExhaustiveKeys} instead. Kept so existing consumer code keeps compiling.
 */
export type AllProps<T extends object> = { [K in keyof T]: undefined };

/**
 * @deprecated Use {@link keysOf} instead — same contract, but it also covers map options, events and
 * marker/popup options rather than source specifications only.
 */
export function AllOptions<T extends object>(obj: AllProps<Required<T>>) {
	return Object.keys(obj) as Array<keyof T>;
}

/**
 * @deprecated Use `keysOf<MglSourceOptions<'geojson'>>({ … })` instead.
 */
export function AllSourceOptions<T = SourceSpecification>(obj: AllProps<Required<Omit<T, 'type'>>>) {
	return Object.keys(obj) as Array<keyof T>;
}

export type ValidLanguages =
	| 'sq'
	| 'am'
	| 'ar'
	| 'hy'
	| 'az'
	| 'eu'
	| 'be'
	| 'bs'
	| 'br'
	| 'bg'
	| 'ca'
	| 'zh'
	| 'co'
	| 'hr'
	| 'cs'
	| 'da'
	| 'nl'
	| 'en'
	| 'eo'
	| 'et'
	| 'fi'
	| 'fr'
	| 'fy'
	| 'ka'
	| 'de'
	| 'el'
	| 'he'
	| 'hi'
	| 'hu'
	| 'is'
	| 'id'
	| 'ga'
	| 'it'
	| 'ja'
	| 'ja-Hira'
	| 'ja_kana'
	| 'ja_rm'
	| 'ja-Latn'
	| 'kn'
	| 'kk'
	| 'ko'
	| 'ko-Latn'
	| 'ku'
	| 'la'
	| 'lv'
	| 'lt'
	| 'lb'
	| 'mk'
	| 'ml'
	| 'mt'
	| 'no'
	| 'oc'
	| 'pl'
	| 'pt'
	| 'ro'
	| 'rm'
	| 'ru'
	| 'gd'
	| 'sr'
	| 'sr-Latn'
	| 'sk'
	| 'sl'
	| 'es'
	| 'sv'
	| 'ta'
	| 'te'
	| 'th'
	| 'tr'
	| 'uk'
	| 'cy';
