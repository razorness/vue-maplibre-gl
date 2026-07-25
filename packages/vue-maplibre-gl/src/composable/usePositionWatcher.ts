import type { IControl, Map } from 'maplibre-gl';
import { inject, onBeforeUnmount, toValue, watch, type MaybeRefOrGetter, type ShallowRef } from 'vue';
import { PositionValues, type PositionProp } from 'components/controls/position.enum';
import { controlRegistrySymbol } from 'types';

/**
 * Keeps a maplibre control mounted at the requested corner, moving it when the position changes.
 *
 * Every control component funnels through here, which makes this the single place that
 *
 * - adds and removes the control on the map,
 * - keeps the per-map {@link ControlRegistry} in sync so `MglMap.dispose()` can tear down exactly the
 *   controls this library added (it used to iterate the private `map._controls`),
 * - and removes the control on unmount — the control components no longer need their own
 *   `onBeforeUnmount` for that.
 *
 * `position` accepts a ref, a getter or a plain value.
 */
export function usePositionWatcher(
	position: MaybeRefOrGetter<PositionProp | undefined>,
	map: ShallowRef<Map | undefined>,
	control: IControl
) {
	const controlRegistry = inject(controlRegistrySymbol, undefined);

	watch(
		() => toValue(position),
		value => {
			// an unknown position would make maplibre throw; ignore it and keep the current corner
			if (value && !PositionValues.includes(value)) {
				return;
			}
			if (map.value?.hasControl(control)) {
				map.value.removeControl(control);
			}
			map.value?.addControl(control, value);
			controlRegistry?.add(control);
		},
		{ immediate: true }
	);

	onBeforeUnmount(() => {
		if (map.value?.hasControl(control)) {
			map.value.removeControl(control);
		}
		controlRegistry?.delete(control);
	});
}
