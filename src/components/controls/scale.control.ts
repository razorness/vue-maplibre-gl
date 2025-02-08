import { Position, type PositionProp, PositionValues } from '@/components/controls/position.enum';
import { usePositionWatcher } from '@/composable/usePositionWatcher';
import { isInitializedSymbol, mapSymbol } from '@/types';
import { ScaleControl } from 'maplibre-gl';
import { defineComponent, inject, onBeforeUnmount, type PropType } from 'vue';

export enum ScaleControlUnit {
	IMPERIAL = 'imperial',
	METRIC   = 'metric',
	NAUTICAL = 'nautical'
}

type UnitValue = ScaleControlUnit | 'imperial' | 'metric' | 'nautical';
const UnitValues = Object.values(ScaleControlUnit);


export default /*#__PURE__*/ defineComponent({
	name : 'MglScaleControl',
	props: {
		position: {
			type     : String as PropType<PositionProp>,
			validator: (v: Position) => {
				return PositionValues.indexOf(v) !== -1;
			}
		},
		maxWidth: { type: Number as PropType<number>, default: 100 },
		unit    : {
			type     : String as PropType<UnitValue>,
			default  : ScaleControlUnit.METRIC,
			validator: (v: ScaleControlUnit) => {
				return UnitValues.indexOf(v) !== -1;
			}
		}
	},
	setup(props) {

		const map           = inject(mapSymbol)!,
			  isInitialized = inject(isInitializedSymbol)!,
			  control       = new ScaleControl({ maxWidth: props.maxWidth, unit: props.unit });

		usePositionWatcher(() => props.position, map, control);
		onBeforeUnmount(() => isInitialized.value && map.value?.removeControl(control));

	},
	render() {
		// nothing
	}
});
