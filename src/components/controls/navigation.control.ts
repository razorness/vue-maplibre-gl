import { Position, type PositionProp, PositionValues } from '@/components/controls/position.enum';
import { usePositionWatcher } from '@/composable/usePositionWatcher';
import { isInitializedSymbol, mapSymbol } from '@/types';
import { NavigationControl } from 'maplibre-gl';
import { defineComponent, inject, onBeforeUnmount, type PropType } from 'vue';

export default /*#__PURE__*/ defineComponent({
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

		const map           = inject(mapSymbol)!,
			  isInitialized = inject(isInitializedSymbol)!,
			  control       = new NavigationControl({ showCompass: props.showCompass, showZoom: props.showZoom, visualizePitch: props.visualizePitch });

		usePositionWatcher(() => props.position, map, control);
		onBeforeUnmount(() => isInitialized.value && map.value?.removeControl(control));

	},
	render() {
		// nothing
	}
});
