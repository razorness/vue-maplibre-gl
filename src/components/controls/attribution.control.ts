import { Position, type PositionProp, PositionValues } from '@/components/controls/position.enum';
import { usePositionWatcher } from '@/composable/usePositionWatcher';
import { isInitializedSymbol, mapSymbol } from '@/types';
import { AttributionControl } from 'maplibre-gl';
import { defineComponent, inject, onBeforeUnmount, type PropType } from 'vue';


export default /*#__PURE__*/ defineComponent({
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

		const map           = inject(mapSymbol)!,
			  isInitialized = inject(isInitializedSymbol)!,
			  control       = new AttributionControl({ compact: props.compact, customAttribution: props.customAttribution });

		usePositionWatcher(() => props.position, map, control);
		onBeforeUnmount(() => isInitialized.value && map.value!.removeControl(control));

	},
	render() {
		// nothing
	}
});
