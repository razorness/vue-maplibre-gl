import { InjectionKey, Ref } from 'vue';
import { Map, Style } from 'maplibre-gl';
import { MglMap } from '@/components/index';
import { Emitter } from 'mitt';
import { SourceLayerRegistry } from '@/components/sources/sourceLayer.registry';

export const mapSymbol: InjectionKey<Ref<Map>>                      = Symbol('map'),
			 isLoadedSymbol: InjectionKey<Ref<boolean>>             = Symbol('isLoaded'),
			 componentIdSymbol: InjectionKey<number>                = Symbol('componentId'),
			 sourceIdSymbol: InjectionKey<string>                   = Symbol('sourceId'),
			 sourceLayerRegistry: InjectionKey<SourceLayerRegistry> = Symbol('sourceLayerRegistry'),
			 emitterSymbol: InjectionKey<Emitter<MglEvents>>        = Symbol('emitter');

export interface MglEvent<T = any> {
	type: string;
	component: InstanceType<typeof MglMap>;
	map: Map;
	event: T;
}

export type MglEvents = {
	styleSwitched: StyleSwitchItem;
}

export interface StyleSwitchItem {
	name: string;
	label: string;
	icon?: {
		path: string;
	};
	style: Style | string;
}
