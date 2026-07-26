import type { Feature, Polygon } from 'geojson';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DrawMode, DrawPlugin, type DrawFeatureProperties, type DrawStyle } from 'plugins/draw';
import { DefaultDrawStyles } from 'plugins/draw/styles';
import { FakeMap } from '@test/fake-map';

/*
 * The draw plugin is framework-agnostic: it takes a maplibre map and drives it directly, so it can be
 * tested without mounting anything. `MglDrawControl` is a thin wrapper around exactly this API.
 */
function makePlugin(options: ConstructorParameters<typeof DrawPlugin>[2] = {}, model?: Feature<Polygon, DrawFeatureProperties>) {
	const map = new FakeMap({ container: document.createElement('div') } as never);
	map.emitLoad();
	const plugin = new DrawPlugin(map as never, model, options);
	return { map, plugin };
}

/** The most recent feature collection the plugin handed to `source.setData`. */
function lastData(map: FakeMap) {
	const source = map.getSource(DrawPlugin.SOURCE_ID) as unknown as { setDataCalls: unknown[] };
	return source.setDataCalls.at(-1) as { features: Feature<Polygon, DrawFeatureProperties>[] };
}

/** A square, deliberately left open — the last position does not repeat the first. */
const openSquare = (size = 1): Feature<Polygon, DrawFeatureProperties> => ({
	type: 'Feature',
	properties: { meta: 'polygon' },
	geometry: {
		type: 'Polygon',
		coordinates: [
			[
				[0, 0],
				[size, 0],
				[size, size],
				[0, size]
			]
		]
	}
});

beforeEach(() => FakeMap.reset());

describe('DrawPlugin setup and teardown', () => {
	it('adds one source and a layer per style', () => {
		const { map, plugin } = makePlugin();
		plugin.setup();

		expect(map.getSource(DrawPlugin.SOURCE_ID)).toBeDefined();
		expect(DefaultDrawStyles.every(style => map.getLayer(style.id))).toBe(true);
	});

	it('removes the layers before the source', () => {
		const { map, plugin } = makePlugin();
		plugin.setup();

		// FakeMap throws if a source goes while a layer still points at it, so this is enforced, not asserted
		expect(() => plugin.dispose()).not.toThrow();
		expect(map.getSource(DrawPlugin.SOURCE_ID)).toBeUndefined();
		expect(DefaultDrawStyles.some(style => map.getLayer(style.id))).toBe(false);
	});

	it('survives a dispose on a map that is already gone', () => {
		const { map, plugin } = makePlugin();
		plugin.setup();
		map.remove();

		expect(() => plugin.dispose()).not.toThrow();
	});

	it('reuses an existing source instead of adding a second one', () => {
		const { map, plugin } = makePlugin();
		plugin.setup();
		const first = map.getSource(DrawPlugin.SOURCE_ID);

		plugin.setup();

		expect(map.getSource(DrawPlugin.SOURCE_ID)).toBe(first);
	});
});

describe('DrawPlugin styles', () => {
	it('defaults to DefaultDrawStyles', () => {
		const { plugin } = makePlugin();
		expect(plugin.options.styles).toBe(DefaultDrawStyles);
	});

	it('takes a replacement style array', () => {
		const styles: DrawStyle[] = [{ id: 'only-fill', type: 'fill', paint: { 'fill-color': '#000' } }];
		const { map, plugin } = makePlugin({ styles });
		plugin.setup();

		expect(map.getLayer('only-fill')).toBeDefined();
		expect(map.getLayer(DefaultDrawStyles[0].id)).toBeUndefined();
	});

	it('swaps the layers when the styles change at runtime', () => {
		const { map, plugin } = makePlugin();
		plugin.setup();

		plugin.setStyles([{ id: 'swapped', type: 'fill', paint: { 'fill-color': '#fff' } }]);

		expect(map.getLayer('swapped')).toBeDefined();
		expect(map.getLayer(DefaultDrawStyles[0].id)).toBeUndefined();
	});
});

describe('DrawPlugin.prepareModel', () => {
	it('closes an open ring', () => {
		const { plugin } = makePlugin();
		const prepared = plugin.prepareModel(openSquare());
		const ring = prepared.geometry.coordinates[0];

		expect(ring).toHaveLength(5);
		expect(ring[0]).toEqual(ring[ring.length - 1]);
	});

	it('leaves an already closed ring alone', () => {
		const { plugin } = makePlugin();
		const closed = plugin.prepareModel(openSquare());

		expect(plugin.prepareModel(closed).geometry.coordinates[0]).toHaveLength(5);
	});

	/*
	 * The regression this guards: the closing check used to compare `end[1] === end[1]`, i.e. `end` with
	 * itself, which is always true. Any ring whose first and last *longitude* matched counted as closed
	 * even with different latitudes, and maplibre then rendered the polygon with a gap.
	 */
	it('closes a ring whose ends share a longitude but not a latitude', () => {
		const { plugin } = makePlugin();
		const sameLng: Feature<Polygon, DrawFeatureProperties> = {
			type: 'Feature',
			properties: { meta: 'polygon' },
			geometry: {
				type: 'Polygon',
				coordinates: [
					[
						[0, 0],
						[1, 1],
						[0, 2]
					]
				]
			}
		};

		const ring = plugin.prepareModel(sameLng).geometry.coordinates[0];

		expect(ring).toHaveLength(4);
		expect(ring[ring.length - 1]).toEqual([0, 0]);
	});

	it('does not mutate the input', () => {
		const { plugin } = makePlugin();
		const input = openSquare();

		plugin.prepareModel(input);

		expect(input.geometry.coordinates[0]).toHaveLength(4);
	});
});

describe('DrawPlugin modes', () => {
	it('starts in the configured mode', () => {
		const { plugin } = makePlugin({ mode: DrawMode.CIRCLE });
		plugin.setup();

		expect(plugin.mode).toBe(DrawMode.CIRCLE);
	});

	it('unsubscribes the old mode when switching', () => {
		const { map, plugin } = makePlugin({ mode: DrawMode.POLYGON });
		plugin.setup();
		const withPolygon = map.listenerCount;

		plugin.setMode(DrawMode.CIRCLE);

		expect(plugin.mode).toBe(DrawMode.CIRCLE);
		// a mode that failed to unregister would leave its handlers behind and both would react
		expect(map.listenerCount).toBeLessThanOrEqual(withPolygon);
	});

	/*
	 * The baseline is a *fresh* map: constructing the plugin already registers the default mode's
	 * handlers plus a `resize` listener, so comparing against the count after construction would let a
	 * leak in the constructor pass unnoticed.
	 */
	it('leaves no handlers behind after dispose', () => {
		const bare = new FakeMap({ container: document.createElement('div') } as never);
		bare.emitLoad();
		const baseline = bare.listenerCount;

		const { map, plugin } = makePlugin();
		plugin.setup();
		expect(map.listenerCount).toBeGreaterThan(baseline);

		plugin.dispose();
		expect(map.listenerCount).toBe(baseline);
	});
});

describe('DrawPlugin model and minArea', () => {
	it('writes the model into the source, closed', () => {
		const { map, plugin } = makePlugin();
		plugin.setup();

		plugin.setModel(openSquare());

		const data = lastData(map);
		expect(data.features[0].geometry.coordinates[0]).toHaveLength(5);
	});

	/*
	 * The feature collection follows a positional convention: [0] is the polygon, [1] the vertices and
	 * [2] the midpoints. The default styles filter on `properties.meta` rather than on the index, but the
	 * modes index into it directly, so the order is load-bearing.
	 */
	it('keeps the polygon first in the collection', () => {
		const { map, plugin } = makePlugin();
		plugin.setup();
		plugin.setModel(openSquare(2));

		const data = lastData(map);
		expect(data.features[0].properties.meta).toBe('polygon');
		expect(data.features[1].geometry.type).toBe('MultiPoint');
	});

	it('registers the hatch pattern only when a minimum area is set', () => {
		const without = makePlugin();
		without.plugin.setup();
		expect(without.map.hasImage(DrawPlugin.MIN_AREA_PATTERN_ID)).toBe(false);

		const withMin = makePlugin({ minArea: { size: 10_000 } });
		withMin.plugin.setup();
		expect(withMin.map.hasImage(DrawPlugin.MIN_AREA_PATTERN_ID)).toBe(true);
	});

	it('flags a polygon below the minimum area', () => {
		const { map, plugin } = makePlugin({ minArea: { size: 1e12, label: 'too small' } });
		plugin.setup();
		plugin.setModel(openSquare(0.001));

		const data = lastData(map);
		expect(data.features[0].properties.tooSmall).toBe(true);
		expect(data.features[0].properties.minSizeLabel).toBe('too small');
	});

	it('does not flag a polygon above the minimum area', () => {
		const { map, plugin } = makePlugin({ minArea: { size: 1 } });
		plugin.setup();
		plugin.setModel(openSquare(1));

		const data = lastData(map);
		expect(data.features[0].properties.tooSmall).toBe(false);
	});

	/*
	 * `setModel` must *not* report back. It is the programmatic direction — what `v-model` writes into the
	 * control — and echoing it would produce exactly the feedback loop the camera binding guards against.
	 * `onUpdate` fires for user edits, which the modes emit themselves.
	 */
	it('does not echo a programmatic setModel through onUpdate', () => {
		const onUpdate = vi.fn();
		const { plugin } = makePlugin({ onUpdate });
		plugin.setup();

		plugin.setModel(openSquare());

		expect(onUpdate).not.toHaveBeenCalled();
	});

	it('exposes the model it was constructed with', () => {
		const { map, plugin } = makePlugin({}, openSquare());
		plugin.setup();

		expect(lastData(map).features[0].geometry.coordinates[0]).toHaveLength(5);
	});
});
