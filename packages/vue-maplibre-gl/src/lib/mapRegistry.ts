/*
 * Typed as the generic `ComponentPublicInstance` rather than `InstanceType<typeof MglMap>`:
 * reaching for the concrete type meant importing the component barrel from the lib layer,
 * which produced a real `lib/ <-> components/` import cycle. See `MglEvent` in ../types.ts,
 * whose `C` type parameter lets consumers narrow it back when they need to.
 */
import type { Map as MaplibreMap } from 'maplibre-gl';
import { reactive, type ComponentPublicInstance, type ShallowRef } from 'vue';
import type { ValidLanguages } from 'types';

export interface MapInstance {
	component?: ComponentPublicInstance;
	map?: MaplibreMap;
	isMounted: boolean;
	isLoaded: boolean;
	language: ValidLanguages | undefined;
}

const instances = new Map<symbol | string, MapInstance>(),
	defaultKey = Symbol('default');

// useMap returns reactive version of MapInstance
export function useMap(key: symbol | string = defaultKey): MapInstance {
	let component = instances.get(key);
	if (!component) {
		component = reactive({ isLoaded: false, isMounted: false, language: undefined });
		instances.set(key, component);
	}
	return component;
}

export function registerMap(
	instance: ComponentPublicInstance,
	map: ShallowRef<MaplibreMap | undefined>,
	key: symbol | string = defaultKey
): MapInstance {
	let component = instances.get(key);
	if (!component) {
		component = reactive({ isLoaded: false, isMounted: false, language: undefined });
		instances.set(key, component);
	}

	component.component = instance;
	component.map = map.value;
	component.isLoaded = map.value?.loaded() || false;
	component.isMounted = false;

	return component;
}

/**
 * Forgets a map instance.
 *
 * Without this, `instances` grew for the lifetime of the page and a remounted map with the same
 * `mapKey` inherited the previous instance's stale `isLoaded`/`isMounted`/`language`.
 */
export function unregisterMap(key: symbol | string = defaultKey) {
	instances.delete(key);
}

/** Test seam: how many map instances are currently registered. */
export function registeredMapCount(): number {
	return instances.size;
}
