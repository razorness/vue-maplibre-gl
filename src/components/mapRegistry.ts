import { MglMap } from '@/components/index';
import maplibregl from 'maplibre-gl';

const instances  = new Map<symbol | string, InstanceType<typeof MglMap>>(),
	  defaultKey = Symbol('default');

export function useMap(key: symbol | string = defaultKey): { component: InstanceType<typeof MglMap> | undefined, map: maplibregl.Map | undefined } {
	const component = instances.get(key);
	return { component, map: component?.map as maplibregl.Map };
}

export function registerMap(instance: InstanceType<typeof MglMap>, key: symbol | string = defaultKey) {
	if (instances.has(key)) {
		return;
	}
	instances.set(key, instance);
}
