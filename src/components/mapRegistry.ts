import { MglMap } from '@/components/index';
import maplibregl from 'maplibre-gl';
import { reactive } from 'vue';

export interface MapInstance {
	component?: InstanceType<typeof MglMap>;
	map?: maplibregl.Map;
	isMounted: boolean;
	isLoaded: boolean;
}

const instances  = new Map<symbol | string, MapInstance>(),
	  defaultKey = Symbol('default');

// useMap returns reactive version of MapInstance
export function useMap(key: symbol | string = defaultKey): MapInstance {
	let component = instances.get(key);
	if (!component) {
		component = reactive({ isLoaded: false, isMounted: false });
		instances.set(key, component);
	}
	return component;
}

export function registerMap(instance: InstanceType<typeof MglMap>, key: symbol | string = defaultKey): MapInstance {
	let component = instances.get(key);
	if (!component) {
		component = reactive({ isLoaded: false, isMounted: false });
		instances.set(key, component);
	}
	component.isLoaded  = false;
	component.isMounted = false;
	component.component = instance;
	component.map       = instance.map as maplibregl.Map;
	component.isLoaded  = (instance.map as maplibregl.Map)?.loaded() || false;

	return component;
}
