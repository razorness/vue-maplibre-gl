import type { IControl, Map } from 'maplibre-gl';

/**
 * Tracks the controls this library added to a map.
 *
 * `MglMap.dispose()` used to iterate `map._controls` — a private maplibre field — to remove
 * everything. That reached controls the library never added (maplibre's own attribution and logo
 * controls, anything a consumer added imperatively) and depended on an API with no stability promise.
 *
 * Control components register here instead, so teardown removes exactly what was registered.
 */
export class ControlRegistry {

	private readonly controls = new Set<IControl>();

	add(control: IControl) {
		this.controls.add(control);
	}

	delete(control: IControl) {
		this.controls.delete(control);
	}

	/** Removes every registered control from the map and forgets them. */
	removeAll(map: Map) {

		for (const control of this.controls) {
			if (map.hasControl(control)) {
				map.removeControl(control);
			}
		}
		this.controls.clear();

	}

	/** Test seam: how many controls are currently registered. */
	get size(): number {
		return this.controls.size;
	}

}
