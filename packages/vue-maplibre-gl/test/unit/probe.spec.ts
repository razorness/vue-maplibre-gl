import { describe, expect, it } from 'vitest';
import { DrawMode, DrawPlugin } from 'plugins/draw';
import { FakeMap } from '@test/fake-map';

const at = (lng: number, lat: number) => ({
	lngLat: { lng, lat, toArray: () => [lng, lat] },
	point: { x: lng * 10, y: -lat * 10 },
	originalEvent: { ctrlKey: false },
	preventDefault: () => {}
});

describe('probe', () => {
	it('ring right before the closing click', () => {
		const map = new FakeMap({ container: document.createElement('div') } as never);
		map.emitLoad();
		const plugin = new DrawPlugin(map as never, undefined, { mode: DrawMode.POLYGON });
		plugin.setup();
		const src = map.getSource(DrawPlugin.SOURCE_ID) as unknown as { setDataCalls: unknown[] };
		const ring = () =>
			(src.setDataCalls.at(-1) as never as { features: { geometry: { coordinates: number[][][] } }[] }).features[0].geometry
				.coordinates[0];

		map.fire('click', at(0, 0));
		map.fire('mousemove', at(20, 0));
		map.fire('click', at(20, 0));
		console.log('after 2 clicks:', JSON.stringify(ring()));
		map.fire('mousemove', at(20, 20));
		map.fire('click', at(20, 20));
		console.log('after 3 clicks:', JSON.stringify(ring()));
		map.fire('mousemove', at(0.5, 0.5));
		console.log('after move to start:', JSON.stringify(ring()));
		expect(true).toBe(true);
	});
});
