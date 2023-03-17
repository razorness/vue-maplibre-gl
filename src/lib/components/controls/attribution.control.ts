import { defineComponent, inject, onBeforeUnmount, PropType } from 'vue';
import { AttributionControl } from 'maplibre-gl';
import { Position, PositionProp, PositionValues } from '@/lib/components/controls/position.enum';
import { mapSymbol } from '@/lib/types';
import { usePositionWatcher } from '@/lib/composable/usePositionWatcher';

export default defineComponent({
	name : 'MglAttributionControl',
	props: {
		position         : {
			type     : String as PropType<PositionProp>,
			validator: (v: Position) => {
				return PositionValues.indexOf(v) !== -1;
			}
		},
		compact          : Boolean as PropType<boolean>,
		customAttribution: [ String, Array ] as PropType<string | string[]>
	},
	setup(props) {

		const map     = inject(mapSymbol)!,
			  control = new AttributionControl({ compact: props.compact, customAttribution: props.customAttribution });
		usePositionWatcher(() => props.position, map, control);
		onBeforeUnmount(() => map.value.removeControl(control));

	},
	render() {
		// nothing
	}
});
