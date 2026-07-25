import { describe, expect, it, vi } from 'vitest';
import { markRaw, shallowRef } from 'vue';
import { ControlRegistry } from 'lib/controlRegistry';
import { debounce, throttle } from 'lib/debounce';
import { applyLayerDiff, needsRecreate } from 'lib/layerDiff';
import { applyMapDiff, applyMapOption } from 'lib/mapDiff';
import { registeredMapCount, registerMap, unregisterMap, useMap } from 'lib/mapRegistry';
import { applySourceDiff, canApplyInPlace } from 'lib/sourceDiff';
import { SourceLayerRegistry } from 'lib/sourceLayer.registry';
import { MglSourceRegistry } from 'lib/sourceRegistry';
import { keysOf, keysOfExcept } from 'types/exhaustive';
import { FakeMap } from '@test/fake-map';

describe('keysOf', () => {
	it('returns the keys of the exhaustive literal', () => {
		expect(keysOf<{ a: number; b: string }>({ a: 0, b: 0 })).toEqual(['a', 'b']);
	});

	it('drops the excluded keys', () => {
		expect(keysOfExcept<{ a: number; b: string; c: boolean }, 'b'>({ a: 0, b: 0, c: 0 }, ['b'])).toEqual(['a', 'c']);
	});
});

describe('debounce', () => {
	it('collapses rapid calls into one, with the last arguments', async () => {
		vi.useFakeTimers();
		const spy = vi.fn(),
			debounced = debounce(spy, 50);

		debounced(1);
		debounced(2);
		debounced(3);
		expect(spy).not.toHaveBeenCalled();

		vi.advanceTimersByTime(50);
		expect(spy).toHaveBeenCalledExactlyOnceWith(3);
		vi.useRealTimers();
	});

	it('fires immediately when asked, then suppresses the trailing call', () => {
		vi.useFakeTimers();
		const spy = vi.fn(),
			debounced = debounce(spy, 50, true);

		debounced('now');
		expect(spy).toHaveBeenCalledExactlyOnceWith('now');

		vi.advanceTimersByTime(50);
		expect(spy, 'immediate mode must not also fire on the trailing edge').toHaveBeenCalledOnce();
		vi.useRealTimers();
	});

	it('can be cancelled before it fires', () => {
		vi.useFakeTimers();
		const spy = vi.fn(),
			debounced = debounce(spy, 50);

		debounced();
		debounced.cancel();
		vi.advanceTimersByTime(100);
		expect(spy).not.toHaveBeenCalled();
		vi.useRealTimers();
	});
});

describe('throttle', () => {
	it('runs once per window and replays the last result in between', () => {
		vi.useFakeTimers();
		let calls = 0;
		const throttled = throttle(() => ++calls, 50);

		expect(throttled()).toBe(1);
		expect(throttled(), 'still inside the window => cached result').toBe(1);

		vi.advanceTimersByTime(50);
		expect(throttled()).toBe(2);
		vi.useRealTimers();
	});
});

describe('MglSourceRegistry', () => {
	it('shares one handle per source id, starting as pending', () => {
		const registry = new MglSourceRegistry(),
			first = registry.get('a');

		expect(first.value, 'a named source starts pending, not absent').toBeNull();
		expect(registry.get('a'), 'the same id must yield the same handle').toBe(first);
		expect(registry.size).toBe(1);
	});

	it('yields a detached, untracked handle for a missing id', () => {
		const registry = new MglSourceRegistry();
		/* `undefined` means "nothing to wait for" — layers with no source add themselves immediately */
		expect(registry.get(undefined).value).toBeUndefined();
		expect(registry.get('').value).toBeUndefined();
		expect(registry.size, 'untracked handles must not be stored').toBe(0);
	});

	it('resets every handle, which is what a style switch needs', () => {
		const registry = new MglSourceRegistry(),
			a = registry.get('a'),
			b = registry.get('b');

		a.value = { id: 'a' } as never;
		b.value = { id: 'b' } as never;
		registry.resetAll();

		expect([a.value, b.value]).toEqual([null, null]);
	});

	it('forgets a deleted id', () => {
		const registry = new MglSourceRegistry();
		registry.get('a');
		registry.delete('a');
		expect(registry.size).toBe(0);
	});
});

describe('SourceLayerRegistry', () => {
	it('runs every registered unmount handler', () => {
		const registry = new SourceLayerRegistry(),
			a = vi.fn(),
			b = vi.fn();

		registry.registerUnmountHandler('a', a);
		registry.registerUnmountHandler('b', b);
		registry.unregisterUnmountHandler('b');
		registry.unmount();

		expect(a).toHaveBeenCalledOnce();
		expect(b, 'an unregistered handler must not run').not.toHaveBeenCalled();
	});
});

describe('ControlRegistry', () => {
	it('removes exactly the controls it was given', () => {
		const map = new FakeMap(),
			registry = new ControlRegistry(),
			mine = { onAdd: () => document.createElement('div'), onRemove: () => {} },
			theirs = { onAdd: () => document.createElement('div'), onRemove: () => {} };

		map.addControl(mine);
		map.addControl(theirs);
		registry.add(mine);

		registry.removeAll(map as never);

		expect(map.controls, 'a control this library did not add must stay').toEqual([theirs]);
		expect(registry.size).toBe(0);
	});

	it('ignores a control that is no longer on the map', () => {
		const map = new FakeMap(),
			registry = new ControlRegistry(),
			control = { onAdd: () => document.createElement('div'), onRemove: () => {} };

		registry.add(control);
		expect(() => registry.removeAll(map as never)).not.toThrow();
	});

	it('forgets a deleted control', () => {
		const registry = new ControlRegistry(),
			control = { onAdd: () => document.createElement('div'), onRemove: () => {} };
		registry.add(control);
		registry.delete(control);
		expect(registry.size).toBe(0);
	});
});

describe('mapRegistry', () => {
	it('creates an entry on first use and reuses it', () => {
		const key = Symbol('k'),
			first = useMap(key);
		expect(useMap(key)).toBe(first);
		unregisterMap(key);
	});

	it('registers, then forgets a map', () => {
		const key = Symbol('k'),
			before = registeredMapCount(),
			/*
			 * `markRaw` matters here: `MapInstance` is `reactive`, so an assigned object would be deeply
			 * proxied — expensive for a maplibre Map and liable to break its internal identity checks.
			 * `MglMap` constructs the map with `markRaw`, and this asserts that identity survives.
			 */
			map = markRaw(new FakeMap()),
			entry = registerMap({} as never, shallowRef(map) as never, key);

		expect(entry.map).toBe(map);
		expect(registeredMapCount()).toBe(before + 1);

		unregisterMap(key);
		expect(registeredMapCount(), 'a remounted map must not inherit stale state').toBe(before);
	});

	it('would proxy a map that was not marked raw', () => {
		const key = Symbol('k'),
			map = new FakeMap();
		/* documents the hazard the markRaw above avoids */
		expect(registerMap({} as never, shallowRef(map) as never, key).map).not.toBe(map);
		unregisterMap(key);
	});

	it('reuses an entry that useMap created first', () => {
		const key = Symbol('k'),
			existing = useMap(key),
			map = new FakeMap();

		expect(registerMap({} as never, shallowRef(map) as never, key)).toBe(existing);
		unregisterMap(key);
	});
});

describe('layerDiff', () => {
	it('needs a recreate only for keys without a setter', () => {
		expect(needsRecreate({ paint: { a: 1 } }, { paint: { a: 2 } })).toBe(false);
		expect(needsRecreate({ 'source-layer': 'a' }, { 'source-layer': 'b' })).toBe(true);
		/* `metadata` has no setter either, so *any* change to it forces a recreate */
		expect(needsRecreate({ metadata: { x: 1 } }, { metadata: { x: 2 } })).toBe(true);
		expect(needsRecreate({ metadata: { x: 1 } }, { metadata: { x: 1 } }), 'equal contents => no recreate').toBe(false);
		expect(needsRecreate(undefined, { paint: {} }), 'nothing to compare against').toBe(false);
	});

	it('applies only the properties that changed', () => {
		const map = new FakeMap();
		map.addSource('s', { type: 'geojson' });
		map.addLayer({ id: 'l', type: 'circle', source: 's', paint: { 'circle-radius': 1, 'circle-color': 'red' } });

		const applied = applyLayerDiff(
			map as never,
			'l',
			{ paint: { 'circle-radius': 1, 'circle-color': 'red' } },
			{ paint: { 'circle-radius': 5, 'circle-color': 'red' } }
		);

		expect(applied).toBe(true);
		expect(map.getLayer('l')!.paint).toEqual({ 'circle-radius': 5, 'circle-color': 'red' });
	});

	it('applies layout, filter and the zoom range', () => {
		const map = new FakeMap();
		map.addSource('s', { type: 'geojson' });
		map.addLayer({ id: 'l', type: 'symbol', source: 's' });

		applyLayerDiff(map as never, 'l', {}, { layout: { 'icon-size': 2 }, filter: ['has', 'x'], minzoom: 3 } as never);

		expect(map.getLayer('l')!.layout).toEqual({ 'icon-size': 2 });
		expect(map.getLayer('l')!.filter).toEqual(['has', 'x']);
		/* setLayerZoomRange takes both bounds, so the unset one falls back to maplibre's own default */
		expect([map.getLayer('l')!.minzoom, map.getLayer('l')!.maxzoom]).toEqual([3, 24]);
	});

	it('reports that a source-layer change cannot be applied', () => {
		const map = new FakeMap();
		expect(applyLayerDiff(map as never, 'l', { 'source-layer': 'a' } as never, { 'source-layer': 'b' } as never)).toBe(false);
	});
});

describe('sourceDiff', () => {
	it('knows which changes have an in-place setter', () => {
		expect(canApplyInPlace('geojson', { data: 1 } as never, { data: 2 } as never)).toBe(true);
		expect(canApplyInPlace('geojson', { buffer: 1 } as never, { buffer: 2 } as never)).toBe(false);
		expect(canApplyInPlace('vector', { tiles: ['a'] }, { tiles: ['b'] })).toBe(true);
		expect(canApplyInPlace('geojson', undefined, { data: 1 } as never)).toBe(false);
	});

	it('uses setData and setClusterOptions for geojson', () => {
		const map = new FakeMap();
		map.addSource('s', { type: 'geojson' });
		const source = map.getSource('s')!;

		const result = applySourceDiff(
			'geojson',
			source as never,
			{ data: 1, cluster: false } as never,
			{ data: 2, cluster: true } as never
		);

		expect(result.applied).toBe(true);
		expect(source.setDataCalls).toEqual([2]);
		expect(source.setClusterOptionsCalls).toHaveLength(1);
		expect(result.pending, 'the async v6 setters are handed back, not dropped').toHaveLength(2);
	});

	it('falls back to an empty collection when data is cleared', () => {
		const map = new FakeMap();
		map.addSource('s', { type: 'geojson' });
		applySourceDiff('geojson', map.getSource('s')! as never, { data: 1 } as never, {} as never);
		expect(map.getSource('s')!.setDataCalls).toEqual([{ type: 'FeatureCollection', features: [] }]);
	});

	it('uses setUrl and setTiles for tiled sources', () => {
		const map = new FakeMap();
		map.addSource('s', { type: 'vector' });
		const source = map.getSource('s')!;

		applySourceDiff('vector', source as never, { url: 'a', tiles: ['x'] }, { url: 'b', tiles: ['y'] });

		expect(source.setUrlCalls).toEqual(['b']);
		expect(source.setTilesCalls).toEqual([['y']]);
	});

	it('prefers updateImage over setCoordinates when the url changes too', () => {
		const map = new FakeMap();
		map.addSource('s', { type: 'image' });
		const source = map.getSource('s')!;

		applySourceDiff('image', source as never, { url: 'a', coordinates: 1 } as never, { url: 'b', coordinates: 2 } as never);

		expect(source.updateImageCalls).toHaveLength(1);
		expect(source.setCoordinatesCalls, 'updateImage covers both').toHaveLength(0);
	});

	it('uses setCoordinates for image, video and canvas', () => {
		for (const kind of ['image', 'video', 'canvas'] as const) {
			const map = new FakeMap();
			map.addSource('s', { type: kind });
			applySourceDiff(kind, map.getSource('s')! as never, { coordinates: 1 } as never, { coordinates: 2 } as never);
			expect(map.getSource('s')!.setCoordinatesCalls, kind).toEqual([2]);
		}
	});

	it('reports that a constructor-only change cannot be applied', () => {
		const map = new FakeMap();
		map.addSource('s', { type: 'geojson' });
		expect(applySourceDiff('geojson', map.getSource('s')! as never, { buffer: 1 } as never, { buffer: 2 } as never).applied).toBe(
			false
		);
	});
});

describe('mapDiff', () => {
	it('routes every live option to its setter', () => {
		const map = new FakeMap();

		applyMapOption(map as never, 'center', [5, 6]);
		applyMapOption(map as never, 'zoom', 7);
		applyMapOption(map as never, 'bearing', 45);
		applyMapOption(map as never, 'pitch', 30);
		applyMapOption(map as never, 'roll', 10);
		applyMapOption(map as never, 'minZoom', 2);
		applyMapOption(map as never, 'maxZoom', 18);
		applyMapOption(map as never, 'minPitch', 5);
		applyMapOption(map as never, 'maxPitch', 60);
		applyMapOption(map as never, 'renderWorldCopies', false);
		applyMapOption(map as never, 'projection', { type: 'globe' });
		applyMapOption(map as never, 'style', 'other');
		applyMapOption(map as never, 'maxBounds', [1, 2]);
		applyMapOption(map as never, 'transformRequest', 'fn');

		expect(map.center).toEqual({ lng: 5, lat: 6 });
		expect([map.zoom, map.bearing, map.pitch, map.roll]).toEqual([7, 45, 30, 10]);
		expect([map.minZoom, map.maxZoom, map.minPitch, map.maxPitch]).toEqual([2, 18, 5, 60]);
		expect(map.renderWorldCopies).toBe(false);
		expect(map.projection).toEqual({ type: 'globe' });
		expect(map.style).toEqual({ name: 'other' });
		expect(map.maxBounds).toEqual([1, 2]);
		expect(map.transformRequest).toBe('fn');
	});

	it('arms the echo guard for camera options only', () => {
		const map = new FakeMap(),
			markProgrammatic = vi.fn();

		applyMapOption(map as never, 'zoom', 3, { markProgrammatic });
		expect(markProgrammatic).toHaveBeenCalledOnce();

		applyMapOption(map as never, 'minZoom', 3, { markProgrammatic });
		expect(markProgrammatic, 'minZoom does not move the camera').toHaveBeenCalledOnce();
	});

	it('only passes fitBounds options when asked to', () => {
		const map = new FakeMap();
		expect(applyMapOption(map as never, 'bounds', [1, 2], { fitBoundsOptions: { useOnBoundsUpdate: true } })).toBe(true);
		expect(map.bounds).toEqual([1, 2]);
	});

	it('treats an undefined camera value as handled, and reports unknown keys', () => {
		const map = new FakeMap();
		expect(applyMapOption(map as never, 'center', undefined)).toBe(true);
		expect(applyMapOption(map as never, 'hash', undefined)).toBe(false);
		expect(applyMapOption(map as never, 'hash', true), 'constructor-only').toBe(false);
	});

	it('returns the keys it could not apply', () => {
		const map = new FakeMap();
		expect(applyMapDiff(map as never, { zoom: 1, hash: false }, { zoom: 2, hash: true })).toEqual(['hash']);
		expect(applyMapDiff(map as never, { zoom: 2 }, { zoom: 2 }), 'unchanged keys are skipped').toEqual([]);
	});
});
