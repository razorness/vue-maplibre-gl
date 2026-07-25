import { vi } from 'vitest';
import { FakeMap } from '@test/fake-map';

/**
 * jsdom ships no `ResizeObserver`, and `useMglMap` constructs one to keep the map sized to its container.
 *
 * The stub records instances so a test can fire a resize deliberately, instead of just silencing the
 * missing global.
 */
class StubResizeObserver implements ResizeObserver {

	static instances: StubResizeObserver[] = [];
	observed: Element[] = [];
	disconnected = false;

	private readonly callback: ResizeObserverCallback;

	constructor(callback: ResizeObserverCallback) {
		this.callback = callback;
		StubResizeObserver.instances.push(this);
	}

	observe(target: Element) {
		this.observed.push(target);
	}

	unobserve(target: Element) {
		this.observed = this.observed.filter(t => t !== target);
	}

	disconnect() {
		this.disconnected = true;
		this.observed = [];
	}

	/** Test helper: pretend the container changed size. */
	trigger() {
		this.callback([], this);
	}

}

vi.stubGlobal('ResizeObserver', StubResizeObserver);

export { StubResizeObserver };

/*
 * Every unit test runs against the FakeMap instead of the real thing.
 *
 * `Map` is replaced wholesale; the other exports are kept as light stand-ins so components that construct
 * a control or a marker still work. `importOriginal` is deliberately *not* used: importing the real
 * maplibre bundle under jsdom pulls in workers and WebGL and is what makes this kind of suite slow.
 */
vi.mock('maplibre-gl', () => {
	class FakeControl {

		onAdd() {
			return document.createElement('div');
		}
		onRemove() {}
		on() {
			return { unsubscribe: () => {} };
		}
		off() {}

	}

	class FakeMarker {

		private lngLat: unknown;
		popup: unknown;
		removed = false;
		element?: HTMLElement;
		constructor(options: { element?: HTMLElement } = {}) {
			this.element = options.element;
		}
		setLngLat(v: unknown) {
			this.lngLat = v;
			return this;
		}
		getLngLat() {
			return this.lngLat;
		}
		addTo() {
			return this;
		}
		remove() {
			this.removed = true;
			return this;
		}
		setPopup(p: unknown) {
			this.popup = p;
			return this;
		}
		on() {
			return this;
		}
		setDraggable() {
			return this;
		}
		setOffset() {
			return this;
		}
		setRotation() {
			return this;
		}
		setPitchAlignment() {
			return this;
		}
		setRotationAlignment() {
			return this;
		}
		setOpacity() {
			return this;
		}
		setSubpixelPositioning() {
			return this;
		}

	}

	class FakePopup {

		opened = false;
		content?: HTMLElement;
		options: unknown;
		constructor(options: unknown = {}) {
			this.options = options;
		}
		addTo() {
			this.opened = true;
			return this;
		}
		remove() {
			this.opened = false;
			return this;
		}
		isOpen() {
			return this.opened;
		}
		setLngLat() {
			return this;
		}
		setText() {
			return this;
		}
		setDOMContent(el: HTMLElement) {
			this.content = el;
			return this;
		}
		setMaxWidth() {
			return this;
		}
		setOffset() {
			return this;
		}
		trackPointer() {
			return this;
		}
		on() {
			return this;
		}

	}

	return {
		Map: FakeMap,
		Marker: FakeMarker,
		Popup: FakePopup,
		AttributionControl: FakeControl,
		NavigationControl: FakeControl,
		ScaleControl: FakeControl,
		FullscreenControl: FakeControl,
		GeolocateControl: FakeControl,
		GlobeControl: FakeControl,
		TerrainControl: FakeControl,
		LogoControl: FakeControl
	};
});
