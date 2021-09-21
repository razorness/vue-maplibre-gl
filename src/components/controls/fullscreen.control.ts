import { defineComponent, inject, onBeforeUnmount, PropType } from 'vue';
import { Position, PositionValue, PositionValues, usePositionWatcher } from '@/components/controls/shared';
import { mapSymbol } from '@/components/types';
import { FullscreenControl } from 'maplibre-gl';

export default defineComponent({
	name : 'MglFullscreenControl',
	props: {
		position : {
			type     : String as PropType<PositionValue>,
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
