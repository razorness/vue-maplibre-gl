import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { h, nextTick, type Component } from 'vue';
import MglBackgroundLayer from 'components/layers/MglBackgroundLayer.vue';
import MglCircleLayer from 'components/layers/MglCircleLayer.vue';
import MglColorReliefLayer from 'components/layers/MglColorReliefLayer.vue';
import MglFillExtrusionLayer from 'components/layers/MglFillExtrusionLayer.vue';
import MglFillLayer from 'components/layers/MglFillLayer.vue';
import MglHeatmapLayer from 'components/layers/MglHeatmapLayer.vue';
import MglHillshadeLayer from 'components/layers/MglHillshadeLayer.vue';
import MglLineLayer from 'components/layers/MglLineLayer.vue';
import MglRasterLayer from 'components/layers/MglRasterLayer.vue';
import MglSymbolLayer from 'components/layers/MglSymbolLayer.vue';
import MglMap from 'components/MglMap.vue';
import MglCanvasSource from 'components/sources/MglCanvasSource.vue';
import MglGeoJsonSource from 'components/sources/MglGeoJsonSource.vue';
import MglImageSource from 'components/sources/MglImageSource.vue';
import MglRasterDemSource from 'components/sources/MglRasterDemSource.vue';
import MglRasterSource from 'components/sources/MglRasterSource.vue';
import MglVectorSource from 'components/sources/MglVectorSource.vue';
import MglVideoSource from 'components/sources/MglVideoSource.vue';
import { FakeMap } from '@test/fake-map';

/*
 * The seventeen named wrappers are thin shims over `<MglSource>` and `<MglLayer>`: they keep their flat
 * props so v5 templates keep compiling, collect them into `options` and render the generic component.
 * Being generated-looking is exactly why they are worth testing as a table — one broken shim would
 * otherwise only surface in a consumer's app.
 */

let mounted: Array<{ unmount: () => void }> = [];

beforeEach(() => {
	FakeMap.reset();
	mounted = [];
});

afterEach(() => {
	for (const wrapper of mounted) wrapper.unmount();
});

async function mountMap(children: () => unknown) {
	const wrapper = mount(MglMap, {
		props: { mapStyle: 'test-style' },
		slots: { default: children },
		attachTo: document.body
	});
	mounted.push(wrapper);
	await nextTick();
	const map = FakeMap.last;
	map.emitLoad();
	await nextTick();
	await nextTick();
	return map;
}

const LAYERS: Array<[string, Component, string, Record<string, unknown>]> = [
	['MglBackgroundLayer', MglBackgroundLayer, 'background', { paint: { 'background-color': '#000' } }],
	['MglCircleLayer', MglCircleLayer, 'circle', { paint: { 'circle-radius': 4 } }],
	['MglColorReliefLayer', MglColorReliefLayer, 'color-relief', { paint: {} }],
	['MglFillExtrusionLayer', MglFillExtrusionLayer, 'fill-extrusion', { paint: { 'fill-extrusion-height': 10 } }],
	['MglFillLayer', MglFillLayer, 'fill', { paint: { 'fill-color': '#f00' } }],
	['MglHeatmapLayer', MglHeatmapLayer, 'heatmap', { paint: { 'heatmap-radius': 8 } }],
	['MglHillshadeLayer', MglHillshadeLayer, 'hillshade', { paint: {} }],
	['MglLineLayer', MglLineLayer, 'line', { paint: { 'line-width': 2 } }],
	['MglRasterLayer', MglRasterLayer, 'raster', { paint: {} }],
	['MglSymbolLayer', MglSymbolLayer, 'symbol', { layout: { 'text-field': 'x' } }]
];

describe.each(LAYERS)('%s', (_name, component, type, props) => {
	it(`adds a ${type} layer with its flat props collected into options`, async () => {
		const map = await mountMap(() => [
			h(MglGeoJsonSource, { sourceId: 'src', options: { data: { type: 'FeatureCollection', features: [] } } }, () => [
				h(component as never, { layerId: 'l', minzoom: 3, maxzoom: 9, ...props } as never)
			])
		]);

		const layer = map.getLayer('l');
		expect(layer).toBeDefined();
		expect(layer!.type).toBe(type);
		expect(layer!.minzoom).toBe(3);
		expect(layer!.maxzoom).toBe(9);
		// `interactive` is deprecated and must never reach addLayer
		expect(layer).not.toHaveProperty('interactive');
	});
});

const SOURCES: Array<[string, Component, string, Record<string, unknown>]> = [
	[
		'MglCanvasSource',
		MglCanvasSource,
		'canvas',
		{
			coordinates: [
				[0, 0],
				[1, 0],
				[1, 1],
				[0, 1]
			],
			canvas: 'c'
		}
	],
	['MglGeoJsonSource', MglGeoJsonSource, 'geojson', { options: { data: { type: 'FeatureCollection', features: [] } } }],
	[
		'MglImageSource',
		MglImageSource,
		'image',
		{
			url: 'i.png',
			coordinates: [
				[0, 0],
				[1, 0],
				[1, 1],
				[0, 1]
			]
		}
	],
	['MglRasterDemSource', MglRasterDemSource, 'raster-dem', { url: 'dem.json' }],
	['MglRasterSource', MglRasterSource, 'raster', { tiles: ['t/{z}/{x}/{y}.png'] }],
	['MglVectorSource', MglVectorSource, 'vector', { url: 'v.json' }],
	[
		'MglVideoSource',
		MglVideoSource,
		'video',
		{
			urls: ['v.mp4'],
			coordinates: [
				[0, 0],
				[1, 0],
				[1, 1],
				[0, 1]
			]
		}
	]
];

describe.each(SOURCES)('%s', (_name, component, type, props) => {
	it(`adds a ${type} source`, async () => {
		const map = await mountMap(() => [h(component as never, { sourceId: 's', ...props } as never)]);

		const source = map.getSource('s');
		expect(source).toBeDefined();
		expect(source!.type).toBe(type);
	});

	it('removes the source again on unmount', async () => {
		const map = await mountMap(() => [h(component as never, { sourceId: 's', ...props } as never)]);
		expect(map.getSource('s')).toBeDefined();

		for (const wrapper of mounted) wrapper.unmount();
		mounted = [];

		expect(map.getSource('s')).toBeUndefined();
	});
});

describe('layer wrappers forward listeners', () => {
	/*
	 * The wrappers declare no `emits` on purpose — declaring them would consume the listeners instead of
	 * passing them on, and maplibre needs the `(event, layerId, handler)` signature Vue cannot express.
	 * They set `inheritAttrs: false` and spread `$attrs` onto `MglLayer` instead, so a listener has to
	 * arrive at the map even though the wrapper itself never emits.
	 */
	it('binds a click handler through to the map', async () => {
		let clicked = 0;
		const map = await mountMap(() => [
			h(MglGeoJsonSource, { sourceId: 'src', options: { data: { type: 'FeatureCollection', features: [] } } }, () => [
				h(MglFillLayer, { layerId: 'l', paint: { 'fill-color': '#f00' }, onClick: () => clicked++ } as never)
			])
		]);

		map.fireLayer('click', 'l', { features: [] });

		expect(clicked).toBe(1);
	});
});
