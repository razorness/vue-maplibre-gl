import type { Feature, MultiPoint, Polygon } from 'geojson';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DrawMode, DrawPlugin, type DrawFeatureProperties } from 'plugins/draw';
import { FakeMap } from '@test/fake-map';

/*
 * Pointer sequences, which is where the draw plugin's real logic lives: `isNearby` works in *pixels*
 * rather than through maplibre feature queries, so these tests only mean anything because the fake map's
 * projection is linear and invertible (see FakeMap.PROJECTION_SCALE).
 *
 * At scale 10, one degree is ten pixels and the mouse tolerance is 24 px — so positions less than
 * 2.4 degrees apart count as the same point, and the coordinates below are spaced well beyond that.
 */
const SCALE = FakeMap.PROJECTION_SCALE;

/** A maplibre-shaped pointer event at a geographic position. */
function at(lng: number, lat: number, originalEvent: Record<string, unknown> = {}) {
	return {
		lngLat: { lng, lat, toArray: () => [lng, lat] },
		point: { x: lng * SCALE, y: -lat * SCALE },
		originalEvent: { ctrlKey: false, ...originalEvent },
		preventDefault: () => {}
	};
}

function setup(options: ConstructorParameters<typeof DrawPlugin>[2] = {}) {
	const map = new FakeMap({ container: document.createElement('div') } as never);
	map.emitLoad();
	const plugin = new DrawPlugin(map as never, undefined, { mode: DrawMode.POLYGON, ...options });
	plugin.setup();
	return { map, plugin };
}

function collection(map: FakeMap) {
	const source = map.getSource(DrawPlugin.SOURCE_ID) as unknown as { setDataCalls: unknown[] };
	return source.setDataCalls.at(-1) as {
		features: [
			Feature<Polygon, DrawFeatureProperties>,
			Feature<MultiPoint, DrawFeatureProperties>,
			Feature<MultiPoint, DrawFeatureProperties>
		];
	};
}

const ring = (map: FakeMap) => collection(map).features[0].geometry.coordinates[0]!;

/*
 * `onMouseMove` is throttled to 16 ms, and in `create` mode that move is what positions the rubber-band
 * vertex at index 1. Fired back to back, the second move is swallowed and the ring keeps a stale position
 * — which then makes the closing click splice out a *real* vertex and hand turf a degenerate ring. Real
 * pointers produce a move every few milliseconds, so the tests advance the clock between them.
 */
function move(map: FakeMap, lng: number, lat: number) {
	map.fire('mousemove', at(lng, lat));
	vi.advanceTimersByTime(20);
}

beforeEach(() => {
	vi.useFakeTimers();
	FakeMap.reset();
});

afterEach(() => vi.useRealTimers());

describe('polygon mode: creating', () => {
	/*
	 * Creation is driven by *clicks*, not by press-and-drag: the first click builds a degenerate ring of
	 * four identical positions, and each following click splices a real position into it.
	 */
	it('starts a polygon on the first click', () => {
		const { map } = setup();

		map.fire('click', at(0, 0));

		expect(ring(map)).toHaveLength(4);
		expect(ring(map).every(position => position[0] === 0 && position[1] === 0)).toBe(true);
	});

	it('adds a vertex per click', () => {
		const { map } = setup();

		map.fire('click', at(0, 0));
		map.fire('click', at(20, 0));
		map.fire('click', at(20, 20));

		const positions = ring(map);
		expect(positions).toContainEqual([20, 0]);
		expect(positions).toContainEqual([20, 20]);
	});

	/*
	 * With a real pointer there is always a `mousemove` between two clicks, and in `create` mode that move
	 * is what positions the rubber-band vertex. Firing clicks alone leaves the ring one position shorter
	 * than the plugin expects, and turf then rejects it — so the moves belong in the sequence.
	 */
	it('closes the polygon when a click lands on the first vertex', () => {
		const onUpdate = vi.fn();
		const { map } = setup({ onUpdate });

		map.fire('click', at(0, 0));
		move(map, 20, 0);
		map.fire('click', at(20, 0));
		move(map, 20, 20);
		map.fire('click', at(20, 20));
		move(map, 0.5, 0.5);
		// within the 24 px tolerance of [0, 0] — one degree is ten pixels
		map.fire('click', at(0.5, 0.5));

		expect(onUpdate).toHaveBeenCalledTimes(1);
	});

	it('closes the polygon on a double click', () => {
		const onUpdate = vi.fn();
		const { map } = setup({ onUpdate });

		map.fire('click', at(0, 0));
		map.fire('click', at(20, 0));
		map.fire('click', at(20, 20));
		map.fire('dblclick', at(20, 20));

		expect(onUpdate).toHaveBeenCalledTimes(1);
	});

	it('generates vertices and midpoints once creation ends', () => {
		const { map } = setup();

		map.fire('click', at(0, 0));
		map.fire('click', at(20, 0));
		map.fire('click', at(20, 20));
		map.fire('dblclick', at(20, 20));

		const [polygon, vertices, midpoints] = collection(map).features;
		expect(polygon.properties.meta).toBe('polygon');
		expect(vertices.properties.meta).toBe('vertex');
		expect(midpoints.properties.meta).toBe('midpoint');
		expect(vertices.geometry.coordinates.length).toBeGreaterThan(2);
		// one midpoint per edge
		expect(midpoints.geometry.coordinates.length).toBeGreaterThan(0);
	});
});

describe('polygon mode: editing', () => {
	/** Draws a closed triangle and returns the map, ready for editing. */
	function withTriangle(options: ConstructorParameters<typeof DrawPlugin>[2] = {}) {
		const context = setup(options);
		context.map.fire('click', at(0, 0));
		move(context.map, 20, 0);
		context.map.fire('click', at(20, 0));
		move(context.map, 20, 20);
		context.map.fire('click', at(20, 20));
		context.map.fire('dblclick', at(20, 20));
		return context;
	}

	/** Vertex and midpoint positions are read from the collection rather than assumed. */
	const vertexAt = (map: FakeMap, index = 0) => collection(map).features[1].geometry.coordinates[index] as [number, number];
	const midpointAt = (map: FakeMap, index = 0) => collection(map).features[2].geometry.coordinates[index] as [number, number];

	it('moves a vertex that was grabbed', () => {
		const { map } = withTriangle();
		const before = ring(map).length;
		const [lng, lat] = vertexAt(map);

		map.fire('mousedown', at(lng, lat));
		move(map, lng + 10, lat + 5);
		map.fire('mouseup', at(lng + 10, lat + 5));

		const positions = ring(map);
		expect(positions).toHaveLength(before);
		expect(positions).not.toContainEqual([lng, lat]);
	});

	it('turns a midpoint into a vertex', () => {
		const { map } = withTriangle();
		const before = ring(map).length;
		const [lng, lat] = midpointAt(map);

		map.fire('mousedown', at(lng, lat));
		move(map, lng + 10, lat + 10);
		map.fire('mouseup', at(lng + 10, lat + 10));

		expect(ring(map).length).toBeGreaterThan(before);
	});

	/*
	 * Deliberately a square: the plugin refuses to remove a vertex once only a triangle would be left
	 * (`len < 5` returns early), which is why the same sequence on `withTriangle()` correctly does nothing.
	 */
	it('removes a vertex on ctrl+click', () => {
		const { map } = setup();
		map.fire('click', at(0, 0));
		move(map, 20, 0);
		map.fire('click', at(20, 0));
		move(map, 20, 20);
		map.fire('click', at(20, 20));
		move(map, 0, 20);
		map.fire('click', at(0, 20));
		map.fire('dblclick', at(0, 20));

		const before = ring(map).length;
		const [lng, lat] = vertexAt(map, 1);

		map.fire('click', at(lng, lat, { ctrlKey: true }));

		expect(ring(map).length).toBeLessThan(before);
	});

	it('keeps a triangle intact on ctrl+click', () => {
		const { map } = withTriangle();
		const before = ring(map).length;
		const [lng, lat] = vertexAt(map);

		map.fire('click', at(lng, lat, { ctrlKey: true }));

		expect(ring(map).length).toBe(before);
	});

	it('reports the edit through onUpdate', () => {
		const onUpdate = vi.fn();
		const { map } = withTriangle({ onUpdate });
		onUpdate.mockClear();
		const [lng, lat] = vertexAt(map);

		map.fire('mousedown', at(lng, lat));
		move(map, lng + 10, lat + 5);
		map.fire('mouseup', at(lng + 10, lat + 5));

		expect(onUpdate).toHaveBeenCalled();
	});

	it('ignores a press that is nowhere near the polygon', () => {
		const { map } = withTriangle();
		const before = JSON.stringify(ring(map));

		map.fire('mousedown', at(-80, -80));
		map.fire('mouseup', at(-80, -80));

		expect(JSON.stringify(ring(map))).toBe(before);
	});
});

describe('circle mode', () => {
	/* A circle is created by a single click and sized by `circleMode.creationSize` pixels, not dragged out. */
	it('creates a circle on click', () => {
		const onUpdate = vi.fn();
		const { map, plugin } = setup({ mode: DrawMode.CIRCLE, onUpdate });
		expect(plugin.mode).toBe(DrawMode.CIRCLE);

		map.fire('click', at(0, 0));

		const polygon = collection(map).features[0];
		expect(polygon.properties.meta).toBe('circle');
		expect(polygon.properties.radius).toBeGreaterThan(0);
		expect(polygon.properties.center).toBeDefined();
		// a circle is approximated by many positions, not by the handful a polygon has
		expect(polygon.geometry.coordinates[0]!.length).toBeGreaterThan(16);
	});

	it('computes the area from the radius rather than from the polygon', () => {
		const { map } = setup({ mode: DrawMode.CIRCLE, minArea: { size: 1 } });

		map.fire('click', at(0, 0));

		const polygon = collection(map).features[0];
		const fromRadius = Math.PI * polygon.properties.radius! ** 2;
		expect(polygon.properties.area).toBeCloseTo(fromRadius, -3);
	});
});
