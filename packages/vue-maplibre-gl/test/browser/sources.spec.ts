import { afterEach, describe, expect, it } from 'vitest';
import { h, ref } from 'vue';
import MglSource from 'components/MglSource.vue';
import MglCanvasSource from 'components/sources/MglCanvasSource.vue';
import MglGeoJsonSource from 'components/sources/MglGeoJsonSource.vue';
import MglImageSource from 'components/sources/MglImageSource.vue';
import MglRasterDemSource from 'components/sources/MglRasterDemSource.vue';
import MglRasterSource from 'components/sources/MglRasterSource.vue';
import MglVectorSource from 'components/sources/MglVectorSource.vue';
import MglVideoSource from 'components/sources/MglVideoSource.vue';
import { cleanupMounted, mountMap, pixelPng, until } from './helpers';
import { points } from './style';

/*
 * Every source kind, against real maplibre. The point is not the data — no tile server is involved — but
 * that maplibre *accepts* the specification each wrapper builds. A renamed or mistyped key is rejected
 * here and silently ignored by a mocked map.
 *
 * Tile requests will fail (the URLs do not resolve); that is expected and irrelevant to what is asserted.
 */

const CORNERS = [
	[6, 52],
	[8, 52],
	[8, 50],
	[6, 50]
] as [number, number][];

afterEach(cleanupMounted);

describe('source kinds', () => {
	it('geojson', async () => {
		const { map } = await mountMap(() => [h(MglGeoJsonSource, { sourceId: 's', data: points } as never)]);
		await until(() => !!map.getSource('s'), 'the source');

		expect(map.getSource('s')!.type).toBe('geojson');
	});

	it('geojson with clustering', async () => {
		const { map } = await mountMap(() => [
			h(MglGeoJsonSource, { sourceId: 's', data: points, cluster: true, clusterRadius: 40 } as never)
		]);
		await until(() => !!map.getSource('s'), 'the source');

		expect((map.getStyle().sources.s as { cluster?: boolean }).cluster).toBe(true);
	});

	it('vector', async () => {
		const { map } = await mountMap(() => [
			h(MglVectorSource, { sourceId: 's', tiles: ['https://example.invalid/{z}/{x}/{y}.pbf'], maxzoom: 14 } as never)
		]);
		await until(() => !!map.getSource('s'), 'the source');

		expect(map.getSource('s')!.type).toBe('vector');
	});

	it('raster', async () => {
		const { map } = await mountMap(() => [
			h(MglRasterSource, { sourceId: 's', tiles: ['https://example.invalid/{z}/{x}/{y}.png'], tileSize: 256 } as never)
		]);
		await until(() => !!map.getSource('s'), 'the source');

		expect(map.getSource('s')!.type).toBe('raster');
	});

	it('raster-dem', async () => {
		const { map } = await mountMap(() => [
			h(MglRasterDemSource, {
				sourceId: 's',
				tiles: ['https://example.invalid/{z}/{x}/{y}.png'],
				tileSize: 256,
				encoding: 'terrarium'
			} as never)
		]);
		await until(() => !!map.getSource('s'), 'the source');

		expect(map.getSource('s')!.type).toBe('raster-dem');
	});

	it('image', async () => {
		const { map } = await mountMap(() => [h(MglImageSource, { sourceId: 's', url: pixelPng, coordinates: CORNERS } as never)]);
		await until(() => !!map.getSource('s'), 'the source');

		expect(map.getSource('s')!.type).toBe('image');
	});

	it('video', async () => {
		const { map } = await mountMap(() => [
			h(MglVideoSource, { sourceId: 's', urls: ['https://example.invalid/clip.mp4'], coordinates: CORNERS } as never)
		]);
		await until(() => !!map.getSource('s'), 'the source');

		expect(map.getSource('s')!.type).toBe('video');
	});

	it('canvas', async () => {
		// a real canvas, which is something only a real browser can offer
		const canvas = document.createElement('canvas');
		canvas.id = 'e2e-canvas';
		canvas.width = 64;
		canvas.height = 64;
		document.body.append(canvas);

		const { map } = await mountMap(() => [h(MglCanvasSource, { sourceId: 's', canvas: 'e2e-canvas', coordinates: CORNERS } as never)]);
		await until(() => !!map.getSource('s'), 'the source');

		/*
		 * The *specification* says `canvas`; the live object reports `image`, because maplibre's
		 * `CanvasSource` extends `ImageSource` and inherits its `type`. Asserting on the instance would be
		 * asserting the wrong thing — and is a reminder that `CanvasSourceSpecification` is not part of the
		 * `SourceSpecification` union either, which is why `types/source.ts` adds it by hand.
		 */
		expect((map.getStyle().sources.s as { type?: string }).type).toBe('canvas');
		canvas.remove();
	});

	it('the generic MglSource narrows to the same specification', async () => {
		const { map } = await mountMap(() => [h(MglSource, { sourceId: 's', type: 'geojson', options: { data: points } } as never)]);
		await until(() => !!map.getSource('s'), 'the source');

		expect(map.getSource('s')!.type).toBe('geojson');
	});
});

describe('source updates', () => {
	it('moves an image source through setCoordinates rather than recreating it', async () => {
		const shifted = CORNERS.map(([lng, lat]) => [lng + 1, lat]) as [number, number][];
		const coordinates = ref(CORNERS);

		const { map, rerender } = await mountMap(() => [
			h(MglImageSource, { sourceId: 's', url: pixelPng, coordinates: coordinates.value } as never)
		]);
		await until(() => !!map.getSource('s'), 'the source');
		const before = map.getSource('s');

		coordinates.value = shifted;
		await rerender();

		// same object: an in-place setter was used, not a remove and re-add
		expect(map.getSource('s')).toBe(before);
	});
});
