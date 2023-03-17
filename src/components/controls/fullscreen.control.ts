import { defineComponent, inject, onBeforeUnmount, PropType } from 'vue';
import { Position, PositionValues } from '@/components/controls/position.enum';
import { mapSymbol } from '@/components/types';
import { FullscreenControl } from 'maplibre-gl';
import { usePositionWatcher } from '@/composable/usePositionWatcher';

export default defineComponent({
	name : 'MglFullscreenControl',
	props: {
		position : {
			type     : String as PropType<Position>,
			default  : Position.TOP_RIGHT,
			validator: (v: Position) => {
				return PositionValues.indexOf(v) !== -1;
			}
		},
		container: {
			type   : HTMLElement as PropType<HTMLElement>,
			default: null
		}
	},
	setup(props) {

		const map     = inject(mapSymbol)!,
			  control = new FullscreenControl(props.container ? { container: props.container } : undefined);
		usePositionWatcher(() => props.position, map, control);
		onBeforeUnmount(() => map.value.removeControl(control));

	},
	render() {
		// nothing
	}
});
