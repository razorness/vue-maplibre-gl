import { afterEach, describe, expect, it } from 'vitest';
import { h } from 'vue';
import MglRasterDemSource from 'components/sources/MglRasterDemSource.vue';
import MglGlobalState from 'components/style/MglGlobalState.vue';
import MglImage from 'components/style/MglImage.vue';
import MglLight from 'components/style/MglLight.vue';
import MglProjection from 'components/style/MglProjection.vue';
import MglSky from 'components/style/MglSky.vue';
import MglTerrain from 'components/style/MglTerrain.vue';
import { cleanupMounted, mountMap, until } from './helpers';
import { otherStyle } from './style';

/*
 * The six style-level settings. These are exactly the ones that need a real map to mean anything: they
 * only apply once the style has loaded, and a style switch wipes them — so the interesting assertion is
 * that they are still there *after* a switch.
 */

afterEach(cleanupMounted);

const dem = (children: () => unknown) =>
	h(MglRasterDemSource, { sourceId: 'dem', tiles: ['https://example.invalid/{z}/{x}/{y}.png'], tileSize: 256 } as never, {
		default: children
	});

describe('style settings', () => {
	it('terrain', async () => {
		const { map } = await mountMap(() => [dem(() => [h(MglTerrain, { source: 'dem', exaggeration: 1.5 } as never)])]);
		await until(() => !!map.getTerrain(), 'terrain to be set');

		expect(map.getTerrain()!.source).toBe('dem');
		expect(map.getTerrain()!.exaggeration).toBe(1.5);
	});

	it('sky', async () => {
		const { map } = await mountMap(() => [h(MglSky, { sky: { 'sky-color': '#8ec5fc' } } as never)]);
		await until(() => !!map.getSky(), 'sky to be set');

		expect(map.getSky()).toBeDefined();
	});

	it('light', async () => {
		const { map } = await mountMap(() => [h(MglLight, { light: { anchor: 'viewport', intensity: 0.4 } } as never)]);
		await until(() => map.getLight()?.intensity === 0.4, 'light to be set');

		expect(map.getLight()!.anchor).toBe('viewport');
	});

	it('projection', async () => {
		const { map } = await mountMap(() => [h(MglProjection, { type: 'globe' } as never)]);
		await until(() => JSON.stringify(map.getProjection()).includes('globe'), 'the globe projection');

		expect(JSON.stringify(map.getProjection())).toContain('globe');
	});

	/*
	 * `image` takes what maplibre's `addImage` takes — a bitmap, `ImageData`, `ImageBitmap` or a
	 * `StyleImageInterface` — and **not** a URL. Passing a URL string is silently useless, which is only
	 * visible against a real map.
	 */
	it('image', async () => {
		const image = new ImageData(new Uint8ClampedArray([255, 0, 0, 255]), 1, 1);
		const { map } = await mountMap(() => [h(MglImage, { id: 'pin', image } as never)]);
		await until(() => map.hasImage('pin'), 'the image to be registered');

		expect(map.hasImage('pin')).toBe(true);
	});

	it('global state', async () => {
		// maplibre exposes no getter for global state, so the assertion is that it accepted it without error
		const { map, errors } = await mountMap(() => [h(MglGlobalState, { state: { highlight: 'red' } } as never)]);

		expect(map).toBeDefined();
		expect(errors.filter(e => JSON.stringify(e).includes('state'))).toEqual([]);
	});
});

describe('style settings survive a style switch', () => {
	/*
	 * Switched with a plain `map.setStyle()`, which is the *harder* path: only `MglStyleSwitchControl`
	 * broadcasts `styleSwitched`, so nothing resets the source handles here and every component has to
	 * notice `style.load` on its own. This is the whole reason the six settings are components — the calls
	 * are wiped by a switch, and getting the re-apply wrong is why hand-rolled terrain wrappers stop
	 * working the moment the basemap is swapped.
	 */
	it('re-applies terrain after a plain setStyle', { timeout: 40_000 }, async () => {
		const { map } = await mountMap(() => [dem(() => [h(MglTerrain, { source: 'dem', exaggeration: 1.2 } as never)])]);
		await until(() => !!map.getTerrain(), 'terrain to be set');

		map.setStyle(otherStyle, { diff: false });
		// v6 types isStyleLoaded() as \`boolean | void\` — it returns nothing when there is no style yet
		await until(() => !!map.isStyleLoaded(), 'the new style');

		await until(() => !!map.getSource('dem'), 'the dem source to come back');
		await until(() => !!map.getTerrain(), 'terrain to come back');

		expect(map.getTerrain()!.source).toBe('dem');
		expect(map.getTerrain()!.exaggeration).toBe(1.2);
	});

	it('re-applies the projection after a plain setStyle', { timeout: 40_000 }, async () => {
		const { map } = await mountMap(() => [h(MglProjection, { type: 'globe' } as never)]);
		await until(() => JSON.stringify(map.getProjection()).includes('globe'), 'the globe projection');

		map.setStyle(otherStyle, { diff: false });
		// v6 types isStyleLoaded() as \`boolean | void\` — it returns nothing when there is no style yet
		await until(() => !!map.isStyleLoaded(), 'the new style');

		await until(() => JSON.stringify(map.getProjection()).includes('globe'), 'the projection to come back');
		expect(JSON.stringify(map.getProjection())).toContain('globe');
	});
});
