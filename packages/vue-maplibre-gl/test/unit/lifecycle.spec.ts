import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import MglLayer from 'components/MglLayer.vue';
import MglMap from 'components/MglMap.vue';
import MglSource from 'components/MglSource.vue';
import { registeredMapCount } from 'lib/mapRegistry';
import { FakeMap } from '@test/fake-map';

/**
 * Mounts a map with children and drives it to the loaded state, which is where sources and layers
 * actually do their work.
 */
async function mountMap(children: () => unknown) {
	const wrapper = mount(MglMap, {
		props: { mapStyle: 'test-style' },
		slots: { default: children },
		attachTo: document.body
	});
	await nextTick();
	const map = FakeMap.last;
	map.emitLoad();
	await nextTick();
	await nextTick();
	return { wrapper: track(wrapper), map };
}

/* every mounted wrapper is unmounted again: all tests share the default map key, so a leaked
 * registration would leak into the next test's baseline */
let mounted: Array<{ unmount: () => void }> = [];

function track<T extends { unmount: () => void }>(wrapper: T): T {
	mounted.push(wrapper);
	return wrapper;
}

beforeEach(() => {
	FakeMap.reset();
	mounted = [];
});

afterEach(() => {
	for (const wrapper of mounted) {
		wrapper.unmount();
	}
});

describe('source and layer lifecycle', () => {
	it('adds the source, then the layer bound to it', async () => {
		const { map } = await mountMap(() =>
			h(MglSource, { sourceId: 'pts', type: 'geojson', options: { data: { type: 'FeatureCollection', features: [] } } }, () => [
				h(MglLayer, { layerId: 'circles', type: 'circle', options: { paint: { 'circle-radius': 4 } } })
			])
		);

		expect(map.sources.has('pts')).toBe(true);
		expect(map.getLayer('circles')).toMatchObject({ source: 'pts', type: 'circle' });
		expect(map.getLayer('circles')!.paint).toEqual({ 'circle-radius': 4 });
	});

	it('removes the layer before its source on unmount', async () => {
		/*
		 * The FakeMap throws when a source is removed while a layer still references it — the same rule
		 * maplibre enforces. So this test failing means the ordering regressed, not that an assertion is
		 * merely unsatisfied.
		 */
		const { wrapper, map } = await mountMap(() =>
			h(MglSource, { sourceId: 'pts', type: 'geojson', options: { data: { type: 'FeatureCollection', features: [] } } }, () => [
				h(MglLayer, { layerId: 'circles', type: 'circle', options: {} })
			])
		);

		expect(() => wrapper.unmount()).not.toThrow();
		expect(map.layers).toHaveLength(0);
		expect(map.sources.size).toBe(0);
	});

	it('holds the layer back until its source exists', async () => {
		/* the layer names a source id that no source component provides yet */
		const show = { value: false },
			Host = defineComponent({
				setup() {
					return () =>
						h(
							MglMap,
							{ mapStyle: 'test-style' },
							{
								default: () => [
									h(MglLayer, { layerId: 'waiting', type: 'circle', source: 'late' }),
									show.value
										? h(MglSource, {
												sourceId: 'late',
												type: 'geojson',
												options: { data: { type: 'FeatureCollection', features: [] } }
											})
										: null
								]
							}
						);
				}
			});

		const wrapper = track(mount(Host, { attachTo: document.body }));
		await nextTick();
		const map = FakeMap.last;
		map.emitLoad();
		await nextTick();

		expect(map.getLayer('waiting'), 'layer must wait for its source').toBeUndefined();

		show.value = true;
		wrapper.vm.$forceUpdate();
		await nextTick();
		await nextTick();

		expect(map.getLayer('waiting'), 'layer must appear once the source is added').toBeDefined();
	});

	it('adds a background layer without any source', async () => {
		const { map } = await mountMap(() =>
			h(MglLayer, { layerId: 'bg', type: 'background', options: { paint: { 'background-color': '#fff' } } })
		);
		expect(map.getLayer('bg')).toMatchObject({ type: 'background', source: undefined });
	});

	it('honours `before` when inserting', async () => {
		const { map } = await mountMap(() =>
			h(MglSource, { sourceId: 's', type: 'geojson', options: { data: { type: 'FeatureCollection', features: [] } } }, () => [
				h(MglLayer, { layerId: 'first', type: 'circle', options: {} }),
				h(MglLayer, { layerId: 'inserted', type: 'circle', options: {}, before: 'first' })
			])
		);
		expect(map.layers.map(l => l.id)).toEqual(['inserted', 'first']);
	});
});

describe('teardown', () => {
	it('unsubscribes every listener and forgets the map instance', async () => {
		const before = registeredMapCount();
		const { wrapper, map } = await mountMap(() =>
			h(MglSource, { sourceId: 'pts', type: 'geojson', options: { data: { type: 'FeatureCollection', features: [] } } }, () => [
				h(MglLayer, { layerId: 'circles', type: 'circle', options: {} })
			])
		);

		expect(map.listenerCount).toBeGreaterThan(0);
		wrapper.unmount();

		/*
		 * `map.remove()` clears the listener maps too, so the meaningful assertion is the registry: it used
		 * to grow for the lifetime of the page, and a remounted map with the same key inherited stale state.
		 */
		expect(map.removed).toBe(true);
		expect(registeredMapCount()).toBe(before);
	});
});
