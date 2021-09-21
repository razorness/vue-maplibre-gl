import { createCommentVNode, defineComponent, h, inject, nextTick, onBeforeUnmount, PropType, ref, Ref, Teleport, watch } from 'vue';
import { Position, PositionValue, PositionValues, usePositionWatcher } from '@/components/controls/shared';
import { IControl } from 'maplibre-gl';
import { mapSymbol } from '@/components/types';


export class CustomControl implements IControl {

	public static readonly CONTROL_CLASS       = 'maplibregl-ctrl';
	public static readonly CONTROL_GROUP_CLASS = 'maplibregl-ctrl-group';

	public readonly container: HTMLDivElement;

	constructor(private isAdded: Ref<boolean>, noClasses: boolean) {
		this.container = document.createElement('div');
		this.setClasses(noClasses);
	}

	getDefaultPosition(): string {
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

export default defineComponent({
	name : 'MglCustomControl',
	props: {
		position : {
			type     : String as PropType<PositionValue>,
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
			  control = new CustomControl(isAdded, props.noClasses);
		usePositionWatcher(() => props.position, map, control);
		watch(() => props.noClasses, v => control.setClasses(v));
		onBeforeUnmount(() => {
			map.value.removeControl(control);
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
