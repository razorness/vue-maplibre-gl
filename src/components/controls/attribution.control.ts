import { defineComponent, inject, onBeforeUnmount, PropType } from 'vue';
import { AttributionControl } from 'maplibre-gl';
import { Position, PositionValue, PositionValues, usePositionWatcher } from '@/components/controls/shared';
import { mapSymbol } from '@/components/types';

export default defineComponent({
	name : 'MglAttributionControl',
	props: {
		position         : {
			type     : String as PropType<PositionValue>,
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
