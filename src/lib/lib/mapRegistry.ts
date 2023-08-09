import { MglMap } from '@/lib/components';
import maplibregl from 'maplibre-gl';
import { reactive, ShallowRef } from 'vue';
import { ValidLanguages } from '@/lib/types';

export interface MapInstance {
	component?: InstanceType<typeof MglMap>;
	map?: maplibregl.Map;
	isMounted: boolean;
	isLoaded: boolean;
	language: ValidLanguages | null;
}

const instances  = new Map<symbol | string, MapInstance>(),
	  defaultKey = Symbol('default');

// useMap returns reactive version of MapInstance
export function useMap(key: symbol | string = defaultKey): MapInstance {
	let component = instances.get(key);
	if (!component) {
		component = reactive({ isLoaded: false, isMounted: false, language: null });
		instances.set(key, component);
	}
	return component;
}

export function registerMap(instance: InstanceType<typeof MglMap>, map: ShallowRef<maplibregl.Map | undefined>, key: symbol | string = defaultKey): MapInstance {
	let component = instances.get(key);
	if (!component) {
		component = reactive({ isLoaded: false, isMounted: false, language: null });
		instances.set(key, component);
	}

	component.isLoaded  = false;
	component.isMounted = false;
	component.component = instance;
	component.map       = map.value;
	component.isLoaded  = map.value?.loaded() || false;

	return component;
}
