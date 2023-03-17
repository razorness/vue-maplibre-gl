import { defineComponent, inject, onBeforeUnmount, PropType } from 'vue';
import { Position, PositionValues } from '@/components/controls/position.enum';
import { mapSymbol } from '@/components/types';
import { NavigationControl } from 'maplibre-gl';
import { usePositionWatcher } from '@/composable/usePositionWatcher';

export default defineComponent({
	name : 'MglNavigationControl',
	props: {
		position      : {
			type     : String as PropType<Position>,
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
		usePositionWatcher(() => props.position, map, control);
		onBeforeUnmount(() => map.value.removeControl(control));

	},
	render() {
		// nothing
	}
});
