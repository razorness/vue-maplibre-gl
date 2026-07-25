import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h, nextTick, ref } from 'vue';
import MglLayer from 'components/MglLayer.vue';
import MglMap from 'components/MglMap.vue';
import MglSource from 'components/MglSource.vue';
import { FakeMap } from '@test/fake-map';

async function loadedMap(children: () => unknown) {
	const wrapper = mount(MglMap, { props: { mapStyle: 'a' }, slots: { default: children }, attachTo: document.body });
	await nextTick();
	const map = FakeMap.last;
	map.emitLoad();
	await nextTick();
	await nextTick();
	return { wrapper, map };
}

/**
 * These behaviours did not exist before: layers were add-only, so changing `paint`/`layout`/`filter`/zoom
 * range at runtime silently did nothing, and sources only reacted through a few hand-written watchers.
 *
 * The assertions are deliberately about *how* the change was applied — a recreate would also end up with
 * the right paint value, but it would restart transitions and drop the layer's z-order.
 */
describe('layer diffing', () => {
	it('changes paint in place instead of recreating the layer', async () => {
		FakeMap.reset();
		const radius = ref(3);
		const { wrapper, map } = await loadedMap(() =>
			h(MglSource, { sourceId: 's', type: 'geojson', options: { data: { type: 'FeatureCollection', features: [] } } }, () => [
				h(MglLayer, { layerId: 'l', type: 'circle', options: { paint: { 'circle-radius': radius.value } } })
			])
		);

		const identity = map.getLayer('l');
		radius.value = 11;
		await nextTick();
		await nextTick();

		expect(map.getLayer('l')!.paint['circle-radius']).toBe(11);
		expect(map.getLayer('l'), 'same layer object => not recreated').toBe(identity);
		wrapper.unmount();
	});

	it('applies filter and zoom range in place', async () => {
		FakeMap.reset();
		const zoom = ref(4);
		const { wrapper, map } = await loadedMap(() =>
			h(MglSource, { sourceId: 's', type: 'geojson', options: { data: { type: 'FeatureCollection', features: [] } } }, () => [
				/* `as never`: `h()` cannot infer the SFC's generic, so the option type collapses to the whole kind union */
				h(MglLayer, { layerId: 'l', type: 'circle', options: { filter: ['==', 'a', zoom.value], minzoom: zoom.value } as never })
			])
		);

		zoom.value = 9;
		await nextTick();
		await nextTick();

		expect(map.getLayer('l')!.filter).toEqual(['==', 'a', 9]);
		expect(map.getLayer('l')!.minzoom).toBe(9);
		wrapper.unmount();
	});

	it('recreates the layer when `source-layer` changes, because maplibre has no setter', async () => {
		FakeMap.reset();
		const sourceLayer = ref('one');
		const { wrapper, map } = await loadedMap(() =>
			h(MglSource, { sourceId: 's', type: 'vector', options: { tiles: ['https://x/{z}/{x}/{y}.pbf'] } }, () => [
				h(MglLayer, { layerId: 'l', type: 'circle', options: { 'source-layer': sourceLayer.value } as never })
			])
		);

		const identity = map.getLayer('l');
		sourceLayer.value = 'two';
		await nextTick();
		await nextTick();

		expect(map.getLayer('l')!['source-layer']).toBe('two');
		expect(map.getLayer('l'), 'a new layer object => recreated').not.toBe(identity);
		wrapper.unmount();
	});
});

describe('source diffing', () => {
	it('uses setData for a geojson data change, not a remove + re-add', async () => {
		FakeMap.reset();
		const data = ref({ type: 'FeatureCollection', features: [] as unknown[] });
		const { wrapper, map } = await loadedMap(() => h(MglSource, { sourceId: 's', type: 'geojson', options: { data: data.value } }));

		const identity = map.getSource('s');
		data.value = {
			type: 'FeatureCollection',
			features: [{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [1, 2] } }]
		};
		await nextTick();
		await nextTick();

		expect(map.getSource('s')!.setDataCalls).toHaveLength(1);
		expect(map.getSource('s'), 'same source object => not recreated').toBe(identity);
		wrapper.unmount();
	});

	it('uses setTiles for a vector tiles change', async () => {
		FakeMap.reset();
		const tiles = ref(['https://a/{z}/{x}/{y}.pbf']);
		const { wrapper, map } = await loadedMap(() => h(MglSource, { sourceId: 's', type: 'vector', options: { tiles: tiles.value } }));

		tiles.value = ['https://b/{z}/{x}/{y}.pbf'];
		await nextTick();
		await nextTick();

		expect(map.getSource('s')!.setTilesCalls).toEqual([['https://b/{z}/{x}/{y}.pbf']]);
		wrapper.unmount();
	});

	it('recreates the source when a constructor-only option changes', async () => {
		FakeMap.reset();
		const buffer = ref(64);
		const { wrapper, map } = await loadedMap(() =>
			h(MglSource, {
				sourceId: 's',
				type: 'geojson',
				options: { data: { type: 'FeatureCollection', features: [] }, buffer: buffer.value }
			})
		);

		const identity = map.getSource('s');
		buffer.value = 128;
		await nextTick();
		await nextTick();

		expect(map.getSource('s'), 'no setter for `buffer` => recreated').not.toBe(identity);
		expect(map.getSource('s')!.options.buffer).toBe(128);
		wrapper.unmount();
	});
});
