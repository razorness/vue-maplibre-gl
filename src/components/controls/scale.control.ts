import { defineComponent, inject, onBeforeUnmount, PropType } from 'vue';
import { Position, PositionValues } from '@/components/controls/position.enum';
import { mapSymbol } from '@/components/types';
import { ScaleControl } from 'maplibre-gl';
import { usePositionWatcher } from '@/composable/usePositionWatcher';

export enum ScaleControlUnit {
	IMPERIAL = 'imperial',
	METRIC   = 'metric',
	NAUTICAL = 'nautical'
}

type UnitValue = keyof Record<ScaleControlUnit, any>;
const UnitValues = Object.values(ScaleControlUnit);


export default defineComponent({
	name : 'MglScaleControl',
	props: {
		position: {
			type     : String as PropType<Position>,
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

		const map     = inject(mapSymbol)!,
			  control = new ScaleControl({ maxWidth: props.maxWidth, unit: props.unit });
		usePositionWatcher(() => props.position, map, control);
		onBeforeUnmount(() => map.value.removeControl(control));

	},
	render() {
		// nothing
	}
});
