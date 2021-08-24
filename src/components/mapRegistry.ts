import { MglMap } from '@/components/index';
import maplibregl from 'maplibre-gl';
import { reactive } from 'vue';

export interface MapInstance {
	component?: InstanceType<typeof MglMap>;
	map?: maplibregl.Map;
}

const instances  = new Map<symbol | string, MapInstance>(),
	  defaultKey = Symbol('default');

// useMap returns reactive version of MapInstance
export function useMap(key: symbol | string = defaultKey): MapInstance {
	let component = instances.get(key);
	if (!component) {
		component = {};
		instances.set(key, reactive(component));
	}
	return component;
}

export function registerMap(instance: InstanceType<typeof MglMap>, key: symbol | string = defaultKey) {
	const component = instances.get(key);
	if (!component) {
		instances.set(key, reactive({ component: instance, map: instance.map as maplibregl.Map }));
		return;
	}
	component.component = instance;
	component.map       = instance.map as maplibregl.Map;
}
