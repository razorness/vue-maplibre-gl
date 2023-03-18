import { defineComponent, inject, onBeforeUnmount, PropType, toRef } from 'vue';
import { Position, PositionProp, PositionValues } from '@/lib/components/controls/position.enum';
import { mapSymbol } from '@/lib/types';
import { NavigationControl } from 'maplibre-gl';
import { usePositionWatcher } from '@/lib/composable/usePositionWatcher';

export default defineComponent({
	name : 'MglNavigationControl',
	props: {
		position      : {
			type     : String as PropType<PositionProp>,
			default  : Position.TOP_RIGHT,
			validator: (v: Position) => {
				return PositionValues.indexOf(v) !== -1;
			}
		},
		showCompass   : { type: Boolean as PropType<boolean>, default: true },
		showZoom      : { type: Boolean as PropType<boolean>, default: true },
		visualizePitch: Boolean as PropType<boolean>
	},
	setup(props) {

		const map     = inject(mapSymbol)!,
			  control = new NavigationControl({ showCompass: props.showCompass, showZoom: props.showZoom, visualizePitch: props.visualizePitch });

		usePositionWatcher(toRef(props, 'position'), map, control);
		onBeforeUnmount(() => map.value.removeControl(control));

	},
	render() {
		// nothing
	}
});
