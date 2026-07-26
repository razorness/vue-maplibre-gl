import type { Feature, MultiPoint, Polygon } from 'geojson';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DrawMode, DrawPlugin, type DrawFeatureProperties } from 'plugins/draw';
import { FakeMap } from '@test/fake-map';

/*
 * The two circle modes, which the pointer suite does not reach:
 *
 * - `CIRCLE` after creation — resizing by a vertex and moving the whole circle.
 * - `CIRCLE_STATIC`, which is different in kind: it builds **DOM elements** pinned to the viewport and
 *   converts them to geometry when the viewport settles, so it is styled with CSS rather than paint
 *   properties. jsdom reports every offset as 0, which is fine — these tests are about the lifecycle,
 *   the DOM it owns and the CSS classes it toggles, not about the resulting geometry.
 */
const SCALE = FakeMap.PROJECTION_SCALE;

function at(lng: number, lat: number) {
	return {
		lngLat: { lng, lat, toArray: () => [lng, lat] },
		point: { x: lng * SCALE, y: -lat * SCALE },
		originalEvent: { ctrlKey: false },
		preventDefault: () => {}
	};
}

function setup(options: ConstructorParameters<typeof DrawPlugin>[2] = {}) {
	const map = new FakeMap({ container: document.createElement('div') } as never);
	map.emitLoad();
	const plugin = new DrawPlugin(map as never, undefined, options);
	plugin.setup();
	return { map, plugin };
}

function collection(map: FakeMap) {
	const source = map.getSource(DrawPlugin.SOURCE_ID) as unknown as { setDataCalls: unknown[] };
	return source.setDataCalls.at(-1) as {
		features: [Feature<Polygon, DrawFeatureProperties>, Feature<MultiPoint, DrawFeatureProperties>];
	};
}

beforeEach(() => FakeMap.reset());

describe('circle mode: editing', () => {
	/** Creates a circle at the origin and returns the map, ready for editing. */
	function withCircle(options: ConstructorParameters<typeof DrawPlugin>[2] = {}) {
		const context = setup({ mode: DrawMode.CIRCLE, ...options });
		context.map.fire('click', at(0, 0));
		return context;
	}

	/*
	 * Deliberately the **first** vertex: the resize anchor is that vertex's index, and the guard used to
	 * be `if (!this._resizeAnker) return`, so index `0` was indistinguishable from "nothing grabbed" and
	 * resizing by the first vertex silently did nothing. The other three always worked.
	 */
	it.each([0, 1, 2, 3])('resizes when vertex %i is grabbed and dragged outwards', index => {
		const { map } = withCircle();
		const before = collection(map).features[0].properties.radius!;
		const [lng, lat] = collection(map).features[1].geometry.coordinates[index] as [number, number];

		map.fire('mousedown', at(lng, lat));
		map.fire('mousemove', at(40, 40));
		map.fire('mouseup', at(40, 40));

		expect(collection(map).features[0].properties.radius).toBeGreaterThan(before);
	});

	it('moves the whole circle when its inside is dragged', () => {
		const { map } = withCircle();
		const before = [...collection(map).features[0].properties.center!];

		// the centre is inside the polygon, so this grabs the circle rather than a vertex
		map.fire('mousedown', at(0, 0));
		map.fire('mousemove', at(10, 10));
		map.fire('mouseup', at(10, 10));

		expect(collection(map).features[0].properties.center).not.toEqual(before);
	});

	it('ignores a multi-touch press', () => {
		const { map } = withCircle();
		const before = JSON.stringify(collection(map).features[0]);

		map.fire('mousedown', { ...at(0, 0), points: [at(0, 0).point, at(1, 1).point] });
		map.fire('mousemove', at(30, 30));

		expect(JSON.stringify(collection(map).features[0])).toBe(before);
	});

	it('ignores a press outside the circle', () => {
		const { map } = withCircle();
		const before = JSON.stringify(collection(map).features[0]);

		map.fire('mousedown', at(-70, -70));
		map.fire('mousemove', at(-60, -60));
		map.fire('mouseup', at(-60, -60));

		expect(JSON.stringify(collection(map).features[0])).toBe(before);
	});

	it('reports the edit through onUpdate', () => {
		const onUpdate = vi.fn();
		const { map } = withCircle({ onUpdate });
		onUpdate.mockClear();

		map.fire('mousedown', at(0, 0));
		map.fire('mousemove', at(10, 10));
		map.fire('mouseup', at(10, 10));

		expect(onUpdate).toHaveBeenCalled();
	});
});

describe('static circle mode', () => {
	const container = (map: FakeMap) => map.getCanvasContainer().querySelector('.maplibregl-draw-circle-mode');

	it('appends its overlay to the canvas container and takes it away again', () => {
		const { map, plugin } = setup({ mode: DrawMode.CIRCLE_STATIC });

		expect(container(map)).not.toBeNull();

		plugin.setMode(DrawMode.POLYGON);
		expect(container(map)).toBeNull();
	});

	it('builds the nested constraint elements the CSS positions', () => {
		const { map } = setup({ mode: DrawMode.CIRCLE_STATIC });
		const root = container(map)!;

		expect(root.querySelector('.maplibregl-draw-circle-mode-height-constraint')).not.toBeNull();
		expect(root.querySelector('.maplibregl-draw-circle-mode-width-constraint')).not.toBeNull();
		expect(root.querySelector('.maplibregl-draw-circle-mode-circle')).not.toBeNull();
	});

	it('puts the minimum-area label into the overlay', () => {
		const { map } = setup({ mode: DrawMode.CIRCLE_STATIC, minArea: { size: 100, label: 'too small' } });

		const label = container(map)!.querySelector('.maplibre-draw-circle-mode-below-min-area-size-label');
		expect(label?.textContent).toBe('too small');
	});

	it('converts the viewport to a circle when it settles', () => {
		const onUpdate = vi.fn();
		setup({ mode: DrawMode.CIRCLE_STATIC, onUpdate });

		FakeMap.last.fire('zoomend');

		expect(onUpdate).toHaveBeenCalled();
		const [feature] = onUpdate.mock.calls.at(-1) as [Feature<Polygon, DrawFeatureProperties>];
		expect(feature.properties.meta).toBe('circle');
		expect(feature.properties.center).toBeDefined();
	});

	/* jsdom gives every element a zero size, so the converted circle has no area — which is what makes
	 * this the easy way to reach the `tooSmall` branch. */
	it('marks the circle as too small through a CSS class', () => {
		const { map } = setup({ mode: DrawMode.CIRCLE_STATIC, minArea: { size: 1_000_000 } });
		const circle = container(map)!.querySelector('.maplibregl-draw-circle-mode-circle')!;

		map.fire('zoom');

		expect(circle.classList.contains('maplibregl-draw-circle-too-small')).toBe(true);
	});

	it('writes a numeric fitBounds padding into a custom property', () => {
		const { map } = setup({ mode: DrawMode.CIRCLE_STATIC, fitBoundsOptions: { padding: 24 } });

		expect((container(map) as HTMLElement).style.getPropertyValue('--padding')).toBe('24px');
	});

	it('writes a per-side padding into one custom property each', () => {
		const { map } = setup({
			mode: DrawMode.CIRCLE_STATIC,
			fitBoundsOptions: { padding: { top: 10, bottom: 20, left: 30, right: 40 } }
		});
		const style = (container(map) as HTMLElement).style;

		expect(style.getPropertyValue('--padding-top')).toBe('10px');
		expect(style.getPropertyValue('--padding-right')).toBe('40px');
	});

	it('takes an existing circle as its model', () => {
		const { plugin } = setup({ mode: DrawMode.CIRCLE_STATIC });

		expect(() =>
			plugin.setModel({
				type: 'Feature',
				properties: { meta: 'circle', center: [0, 0], radius: 500 },
				geometry: { type: 'Polygon', coordinates: [[[0, 0]]] }
			} as never)
		).not.toThrow();
	});

	it('unsubscribes its viewport listeners on dispose', () => {
		const bare = new FakeMap({ container: document.createElement('div') } as never);
		bare.emitLoad();
		const baseline = bare.listenerCount;

		const { map, plugin } = setup({ mode: DrawMode.CIRCLE_STATIC });
		expect(map.listenerCount).toBeGreaterThan(baseline);

		plugin.dispose();
		expect(map.listenerCount).toBe(baseline);
	});
});
