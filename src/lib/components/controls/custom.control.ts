import { createCommentVNode, defineComponent, h, inject, nextTick, onBeforeUnmount, PropType, ref, Ref, Teleport, toRef, watch } from 'vue';
import { Position, PositionProp, PositionValues } from '@/lib/components/controls/position.enum';
import { ControlPosition, IControl } from 'maplibre-gl';
import { mapSymbol } from '@/lib/types';
import { usePositionWatcher } from '@/lib/composable/usePositionWatcher';


export class CustomControl implements IControl {

	public static readonly CONTROL_CLASS       = 'maplibregl-ctrl';
	public static readonly CONTROL_GROUP_CLASS = 'maplibregl-ctrl-group';

	public readonly container: HTMLDivElement;

	constructor(private isAdded: Ref<boolean>, noClasses: boolean) {
		this.container = document.createElement('div');
		this.setClasses(noClasses);
	}

	getDefaultPosition(): ControlPosition {
		return Position.TOP_LEFT;
	}

	onAdd(): HTMLElement {
		nextTick(() => this.isAdded.value = true);
		return this.container;
	}

	onRemove(): void {
		this.isAdded.value = false;
		this.container.remove();
	}

	setClasses(noClasses: boolean) {
		if (noClasses) {
			this.container.classList.remove(CustomControl.CONTROL_CLASS);
			this.container.classList.remove(CustomControl.CONTROL_GROUP_CLASS);
		} else {
			this.container.classList.add(CustomControl.CONTROL_CLASS);
			this.container.classList.add(CustomControl.CONTROL_GROUP_CLASS);
		}
	}

}

export default /*#__PURE__*/ defineComponent({
	name : 'MglCustomControl',
	props: {
		position : {
			type     : String as PropType<PositionProp>,
			validator: (v: Position) => {
				return PositionValues.indexOf(v) !== -1;
			}
		},
		noClasses: {
			type   : Boolean as PropType<boolean>,
			default: false
		}
	},
	setup(props) {

		const map     = inject(mapSymbol)!,
			  isAdded = ref(false),
			  control = new CustomControl(isAdded, props.noClasses!);

		usePositionWatcher(toRef(props, 'position'), map, control);
		watch(toRef(props, 'noClasses'), v => control.setClasses(v!));
		onBeforeUnmount(() => {
			map.value?.removeControl(control);
		});

		return { isAdded, container: control.container };

	},
	render() {
		if (!this.isAdded) {
			return createCommentVNode('custom-component');
		}
		return h(
			Teleport as any,
			{ to: this.container },
			this.$slots.default ? this.$slots.default() : undefined
		);
	}
});
