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

/*
 * jsdom implements no canvas, so `getContext('2d')` returns null. The draw plugin draws its
 * minimum-area hatch pattern to a canvas and hands the pixels to `map.addImage`, which means the whole
 * minArea path is untestable without a 2D context. This records the calls instead of rasterising —
 * enough to assert that the pattern is produced and registered, without pulling in the `canvas` package
 * and its native build.
 */
const drawCalls: string[] = [];

HTMLCanvasElement.prototype.getContext = function fakeGetContext(this: HTMLCanvasElement, kind: string) {
	if (kind !== '2d') return null;
	const record =
		(name: string) =>
		(...args: unknown[]) =>
			void drawCalls.push(`${name}(${args.join(',')})`);
	return {
		canvas: this,
		fillStyle: '',
		strokeStyle: '',
		lineWidth: 1,
		globalAlpha: 1,
		beginPath: record('beginPath'),
		closePath: record('closePath'),
		moveTo: record('moveTo'),
		lineTo: record('lineTo'),
		stroke: record('stroke'),
		fill: record('fill'),
		fillRect: record('fillRect'),
		clearRect: record('clearRect'),
		translate: record('translate'),
		rotate: record('rotate'),
		scale: record('scale'),
		save: record('save'),
		restore: record('restore'),
		setTransform: record('setTransform'),
		getImageData: (_x: number, _y: number, w: number, h: number) => ({
			width: w,
			height: h,
			data: new Uint8ClampedArray(w * h * 4)
		})
	} as unknown as CanvasRenderingContext2D;
} as typeof HTMLCanvasElement.prototype.getContext;

/** What the code under test drew, for a test that wants to assert on it. */
export const canvasDrawCalls = drawCalls;
