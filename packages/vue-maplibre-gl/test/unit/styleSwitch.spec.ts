import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h, nextTick } from 'vue';
import MglLayer from 'components/MglLayer.vue';
import MglMap from 'components/MglMap.vue';
import MglSource from 'components/MglSource.vue';
import MglTerrain from 'components/style/MglTerrain.vue';
import { FakeMap } from '@test/fake-map';

/**
 * The regression this file exists for: `setStyle({ diff: false })` throws every source, layer and image
 * away, and everything has to re-add itself on the following `style.load`. Historically this either left
 * duplicate layer ids behind or silently stopped re-adding after the first switch — so the test switches
 * repeatedly rather than once.
 */
describe('style switching', () => {
	it('re-adds sources and layers after every switch, without leaking ids', async () => {
		FakeMap.reset();

		const wrapper = mount(MglMap, {
			props: { mapStyle: 'a' },
			slots: {
				default: () => [
					h(
						MglSource,
						{ sourceId: 'pts', type: 'geojson', options: { data: { type: 'FeatureCollection', features: [] } } },
						() => [h(MglLayer, { layerId: 'circles', type: 'circle', options: { paint: { 'circle-radius': 3 } } })]
					),
					h(MglTerrain, { source: 'dem', exaggeration: 1.4 })
				]
			},
			attachTo: document.body
		});
		await nextTick();

		const map = FakeMap.last;
		map.emitLoad();
		await nextTick();
		await nextTick();

		expect(map.sources.size).toBe(1);
		expect(map.layers).toHaveLength(1);
		expect(map.terrain).toEqual({ source: 'dem', exaggeration: 1.4 });

		for (let round = 1; round <= 5; round++) {
			/* what MglStyleSwitchControl broadcasts before calling setStyle */
			map.emitStyleLoad();
			await nextTick();
			await nextTick();

			expect(map.sources.size, `round ${round}: exactly one source`).toBe(1);
			expect(
				map.layers.map(l => l.id),
				`round ${round}: no duplicate layer ids`
			).toEqual(['circles']);
			expect(map.terrain, `round ${round}: terrain re-applied`).toEqual({ source: 'dem', exaggeration: 1.4 });
		}

		wrapper.unmount();
	});
});
