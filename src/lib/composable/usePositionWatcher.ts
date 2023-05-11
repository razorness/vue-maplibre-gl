import { WatchSource } from '@vue/runtime-core';
import { ShallowRef, watch } from 'vue';
import { IControl, Map } from 'maplibre-gl';
import { Position, PositionProp, PositionValues } from '@/lib/components/controls/position.enum';

export function usePositionWatcher(source: WatchSource<PositionProp | undefined>, map: ShallowRef<Map | null>, control: IControl) {
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