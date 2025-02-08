import { type Position, type PositionProp, PositionValues } from '@/components/controls/position.enum';
import type { WatchSource } from '@vue/runtime-core';
import type { IControl, Map } from 'maplibre-gl';
import { type ShallowRef, watch } from 'vue';

export function usePositionWatcher(source: WatchSource<PositionProp | undefined>, map: ShallowRef<Map | undefined>, control: IControl) {
	watch(source, (v) => {
		if (v && PositionValues.indexOf(v as Position) === -1) {
			return;
		}
		if (map.value?.hasControl(control)) {
			map.value.removeControl(control);
		}
		map.value?.addControl(control, v);
	}, { immediate: true });
}
