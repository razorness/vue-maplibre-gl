import type { ControlPosition, IControl } from 'maplibre-gl';
import { nextTick, type Ref } from 'vue';
import { Position } from 'components/controls/position.enum';

/**
 * A maplibre `IControl` that is nothing but an empty container, so Vue can `Teleport` arbitrary markup
 * into a real control slot on the map.
 *
 * Lives in its own module rather than inside `MglCustomControl.vue`: an SFC can only export the
 * component itself, and this class is part of the public API — it is also what `MglStyleSwitchControl`
 * and the draw plugin build on.
 */
export class CustomControl implements IControl {

	public static readonly CONTROL_CLASS = 'maplibregl-ctrl';
	public static readonly CONTROL_GROUP_CLASS = 'maplibregl-ctrl-group';

	public readonly container: HTMLDivElement;

	private isAdded: Ref<boolean>;

	constructor(isAdded: Ref<boolean>, noClasses: boolean) {
		this.isAdded = isAdded;
		this.container = document.createElement('div');
		this.setClasses(noClasses);
	}

	getDefaultPosition(): ControlPosition {
		return Position.TOP_LEFT;
	}

	onAdd(): HTMLElement {
		// deferred: the container is only in the DOM after maplibre has appended it
		void nextTick(() => (this.isAdded.value = true));
		return this.container;
	}

	onRemove(): void {
		this.isAdded.value = false;
		this.container.remove();
	}

	setClasses(noClasses: boolean) {

		if (noClasses) {
			this.container.classList.remove(CustomControl.CONTROL_CLASS, CustomControl.CONTROL_GROUP_CLASS);
		} else {
			this.container.classList.add(CustomControl.CONTROL_CLASS, CustomControl.CONTROL_GROUP_CLASS);
		}

	}

}
