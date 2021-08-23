import { Ref, watch } from 'vue';
import { WatchSource } from '@vue/runtime-core';
import { IControl, Map } from 'maplibre-gl';

export enum Position {
	TOP_LEFT     = 'top-left',
	TOP_RIGHT    = 'top-right',
	BOTTOM_LEFT  = 'bottom-left',
	BOTTOM_RIGHT = 'bottom-right'
}

export type PositionValue = keyof Record<Position, any>;
export const PositionValues = Object.values(Position);

export function usePositionWatcher(source: WatchSource<Position | undefined>, map: Ref<Map>, control: IControl) {
	watch(source, (v) => {
		if (v && PositionValues.indexOf(v) === -1) {
			return;
		}
		if (map.value.hasControl(control)) {
			map.value.removeControl(control);
		}
		map.value.addControl(control, v);
	}, { immediate: true });
}
