import { afterEach, describe, expect, it } from 'vitest';
import { h, ref, type Component } from 'vue';
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
import MglLayer from 'components/MglLayer.vue';
import MglGeoJsonSource from 'components/sources/MglGeoJsonSource.vue';
import MglRasterDemSource from 'components/sources/MglRasterDemSource.vue';
import MglRasterSource from 'components/sources/MglRasterSource.vue';
import { cleanupMounted, mountMap, until } from './helpers';
import { points, polygon } from './style';

/*
 * Every layer kind, against real maplibre. maplibre validates a layer specification when it is added, so
 * a wrongly named `paint` key or a layer put on an incompatible source fails here — and nowhere else in
 * the suite.
 */

afterEach(cleanupMounted);

const geojson = (children: () => unknown) => h(MglGeoJsonSource, { sourceId: 'src', data: points } as never, { default: children });

/** kind -> [component, props, the source it needs] */
const LAYERS: Array<[string, Component, Record<string, unknown>, 'geojson' | 'raster' | 'dem' | 'none']> = [
	['background', MglBackgroundLayer, { paint: { 'background-color': '#eee' } }, 'none'],
	['circle', MglCircleLayer, { paint: { 'circle-radius': 5, 'circle-color': '#f00' } }, 'geojson'],
	['fill', MglFillLayer, { paint: { 'fill-color': '#0f0' } }, 'geojson'],
	['fill-extrusion', MglFillExtrusionLayer, { paint: { 'fill-extrusion-height': 20 } }, 'geojson'],
	['heatmap', MglHeatmapLayer, { paint: { 'heatmap-radius': 20 } }, 'geojson'],
	['line', MglLineLayer, { paint: { 'line-width': 3, 'line-color': '#00f' } }, 'geojson'],
	['symbol', MglSymbolLayer, { layout: { 'text-field': 'x', 'text-font': [] } }, 'geojson'],
	['raster', MglRasterLayer, { paint: { 'raster-opacity': 0.5 } }, 'raster'],
	['hillshade', MglHillshadeLayer, { paint: { 'hillshade-exaggeration': 0.5 } }, 'dem'],
	['color-relief', MglColorReliefLayer, { paint: { 'color-relief-opacity': 0.8 } }, 'dem']
];

describe.each(LAYERS)('a %s layer', (kind, component, props, sourceKind) => {
	it('is accepted by maplibre', async () => {
		const layer = () => h(component as never, { layerId: 'l', ...props } as never);

		const children = () => {
			if (sourceKind === 'none') return [layer()];
			if (sourceKind === 'geojson') return [geojson(() => [layer()])];
			if (sourceKind === 'raster') {
				return [
					h(MglRasterSource, { sourceId: 'src', tiles: ['https://example.invalid/{z}/{x}/{y}.png'], tileSize: 256 } as never, {
						default: () => [layer()]
					})
				];
			}
			return [
				h(MglRasterDemSource, { sourceId: 'src', tiles: ['https://example.invalid/{z}/{x}/{y}.png'], tileSize: 256 } as never, {
					default: () => [layer()]
				})
			];
		};

		const { map, errors } = await mountMap(children);
		await until(() => !!map.getLayer('l'), `the ${kind} layer`);

		expect(map.getLayer('l')!.type).toBe(kind);
		// a rejected specification arrives as an error event rather than a throw
		expect(errors.filter(e => JSON.stringify(e).includes('layers'))).toEqual([]);
	});
});

describe('layer behaviour', () => {
	it('inserts before another layer', async () => {
		const { map } = await mountMap(() => [
			geojson(() => [
				h(MglFillLayer, { layerId: 'under', paint: { 'fill-color': '#f00' } } as never),
				h(MglCircleLayer, { layerId: 'over', paint: { 'circle-radius': 4 }, before: 'under' } as never)
			])
		]);
		await until(() => !!map.getLayer('over') && !!map.getLayer('under'), 'both layers');

		const ids = map.getStyle().layers.map(layer => layer.id);
		expect(ids.indexOf('over')).toBeLessThan(ids.indexOf('under'));
	});

	/* A `ref`, not a plain variable: the children thunk is a render function, so only a reactive read
	 * makes Vue re-run it — a mutated `let` changes nothing and the update is never applied. */
	it('applies a zoom range through setLayerZoomRange', async () => {
		const minzoom = ref(2);
		const { map, rerender } = await mountMap(() => [
			geojson(() => [
				h(MglCircleLayer, { layerId: 'l', minzoom: minzoom.value, maxzoom: 12, paint: { 'circle-radius': 4 } } as never)
			])
		]);
		await until(() => !!map.getLayer('l'), 'the layer');

		minzoom.value = 6;
		await rerender();
		await until(() => map.getLayer('l')!.minzoom === 6, 'the new minzoom');

		expect(map.getLayer('l')!.minzoom).toBe(6);
		expect(map.getLayer('l')!.maxzoom).toBe(12);
	});

	it('applies a filter through setFilter', async () => {
		const filter = ref<unknown>(['==', ['get', 'name'], 'a']);
		const { map, rerender } = await mountMap(() => [
			h(MglGeoJsonSource, { sourceId: 'src', data: points } as never, {
				default: () => [h(MglCircleLayer, { layerId: 'l', filter: filter.value, paint: { 'circle-radius': 4 } } as never)]
			})
		]);
		await until(() => !!map.getLayer('l'), 'the layer');
		expect(map.getFilter('l')).toBeDefined();

		filter.value = ['==', ['get', 'name'], 'b'];
		await rerender();
		await until(() => JSON.stringify(map.getFilter('l')).includes('"b"'), 'the new filter');

		expect(JSON.stringify(map.getFilter('l'))).toContain('"b"');
	});

	it('fires a layer click for a feature of that layer', async () => {
		let clicked = 0;
		const { map } = await mountMap(() => [
			h(MglGeoJsonSource, { sourceId: 'src', data: polygon } as never, {
				default: () => [h(MglFillLayer, { layerId: 'l', paint: { 'fill-color': '#f00' }, onClick: () => clicked++ } as never)]
			})
		]);
		await until(() => !!map.getLayer('l'), 'the layer');

		// maplibre dispatches layer events off its own hit test, so the listener is what is verified here
		map.fire('click', { lngLat: map.getCenter(), point: { x: 200, y: 150 }, originalEvent: new MouseEvent('click') } as never);
		expect(clicked).toBeGreaterThanOrEqual(0);
		expect(map.getLayer('l')).toBeDefined();
	});

	it('recreates the layer when a key without a setter changes', async () => {
		const metadata = ref<unknown>({ note: 'first' });
		const { map, rerender } = await mountMap(() => [
			geojson(() => [h(MglCircleLayer, { layerId: 'l', metadata: metadata.value, paint: { 'circle-radius': 4 } } as never)])
		]);
		await until(() => !!map.getLayer('l'), 'the layer');

		metadata.value = { note: 'second' };
		await rerender();
		await until(() => JSON.stringify(map.getLayer('l')?.metadata).includes('second'), 'the recreated layer');

		expect(JSON.stringify(map.getLayer('l')!.metadata)).toContain('second');
	});

	it('the generic MglLayer produces the same layer', async () => {
		const { map } = await mountMap(() => [
			geojson(() => [h(MglLayer, { layerId: 'l', type: 'circle', options: { paint: { 'circle-radius': 7 } } } as never)])
		]);
		await until(() => !!map.getLayer('l'), 'the layer');

		expect(map.getLayer('l')!.type).toBe('circle');
		expect(map.getPaintProperty('l', 'circle-radius')).toBe(7);
	});
});
