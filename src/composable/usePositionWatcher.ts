import { WatchSource } from '@vue/runtime-core';
import { Ref, watch } from 'vue';
import { IControl, Map } from 'maplibre-gl';
import { Position, PositionValues } from '@/components/controls/position.enum';

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