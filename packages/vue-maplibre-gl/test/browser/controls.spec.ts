import { afterEach, describe, expect, it } from 'vitest';
import { h, nextTick, type Component } from 'vue';
import MglAttributionControl from 'components/controls/MglAttributionControl.vue';
import MglCustomControl from 'components/controls/MglCustomControl.vue';
import MglFrameRateControl from 'components/controls/MglFrameRateControl.vue';
import MglFullscreenControl from 'components/controls/MglFullscreenControl.vue';
import MglGeolocationControl from 'components/controls/MglGeolocationControl.vue';
import MglGlobeControl from 'components/controls/MglGlobeControl.vue';
import MglLogoControl from 'components/controls/MglLogoControl.vue';
import MglNavigationControl from 'components/controls/MglNavigationControl.vue';
import MglScaleControl from 'components/controls/MglScaleControl.vue';
import MglStyleSwitchControl from 'components/controls/MglStyleSwitchControl.vue';
import MglTerrainControl from 'components/controls/MglTerrainControl.vue';
import MglRasterDemSource from 'components/sources/MglRasterDemSource.vue';
import { cleanupMounted, mountMap, until } from './helpers';
import { blankStyle, otherStyle } from './style';

/*
 * All eleven controls against real maplibre. maplibre owns where a control lands in the DOM, so this is
 * the only place that can show a control actually reaching the map rather than just being handed to a
 * mocked `addControl`.
 */

afterEach(cleanupMounted);

const CONTROLS: Array<[string, Component, Record<string, unknown>, string]> = [
	['navigation', MglNavigationControl, {}, '.maplibregl-ctrl-zoom-in'],
	['scale', MglScaleControl, {}, '.maplibregl-ctrl-scale'],
	['attribution', MglAttributionControl, {}, '.maplibregl-ctrl-attrib'],
	['fullscreen', MglFullscreenControl, {}, '.maplibregl-ctrl-fullscreen'],
	['geolocation', MglGeolocationControl, {}, '.maplibregl-ctrl-geolocate'],
	['globe', MglGlobeControl, {}, '.maplibregl-ctrl-globe'],
	['logo', MglLogoControl, {}, '.maplibregl-ctrl-logo'],
	['frame rate', MglFrameRateControl, {}, 'canvas'],
	['style switch', MglStyleSwitchControl, { mapStyles: [{ name: 'a', label: 'A', style: blankStyle }] }, 'button'],
	['custom', MglCustomControl, {}, '.maplibregl-ctrl']
];

describe.each(CONTROLS)('the %s control', (_name, component, props, selector) => {
	it('lands in the map container', async () => {
		await mountMap(() => [h(component as never, props as never)]);
		await until(() => !!document.querySelector(`.maplibregl-control-container ${selector}`), `${selector} in the container`);

		expect(document.querySelector(`.maplibregl-control-container ${selector}`)).not.toBeNull();
	});

	it('is gone again after unmount', async () => {
		const mounted = await mountMap(() => [h(component as never, props as never)]);
		await until(() => !!document.querySelector(`.maplibregl-control-container ${selector}`), `${selector} in the container`);

		mounted.unmount();
		await nextTick();

		expect(document.querySelector(`.maplibregl-control-container ${selector}`)).toBeNull();
	});
});

describe('the terrain control', () => {
	it('lands in the map container once its source exists', async () => {
		await mountMap(() => [
			h(MglRasterDemSource, { sourceId: 'dem', tiles: ['https://example.invalid/{z}/{x}/{y}.png'], tileSize: 256 } as never),
			h(MglTerrainControl, { source: 'dem' } as never)
		]);
		await until(() => !!document.querySelector('.maplibregl-ctrl-terrain'), 'the terrain button');

		expect(document.querySelector('.maplibregl-ctrl-terrain')).not.toBeNull();
	});
});

describe('the custom control', () => {
	it('teleports its slot content into the control', async () => {
		await mountMap(() => [h(MglCustomControl, null, { default: () => h('span', { class: 'e2e-custom' }, 'mine') })]);
		await until(() => !!document.querySelector('.e2e-custom'), 'the slot content');

		expect(document.querySelector('.maplibregl-control-container .e2e-custom')?.textContent).toBe('mine');
	});
});

describe('the style switch control', () => {
	it('switches the map style when a style is picked', async () => {
		const styles = [
			{ name: 'a', label: 'A', style: blankStyle },
			{ name: 'b', label: 'B', style: otherStyle }
		];
		const { map } = await mountMap(() => [h(MglStyleSwitchControl, { mapStyles: styles } as never)]);
		await until(() => document.querySelectorAll('.maplibregl-control-container button').length > 0, 'the control button');

		const before = map.getPaintProperty('background', 'background-color');
		(document.querySelectorAll('.maplibregl-control-container button')[0] as HTMLButtonElement).click();
		await nextTick();

		const buttons = [...document.querySelectorAll('.maplibregl-control-container button')] as HTMLButtonElement[];
		buttons.at(-1)!.click();

		/*
		 * The style is momentarily *gone* while maplibre swaps it, and reading a paint property then throws
		 * from inside maplibre — so the wait has to gate on `isStyleLoaded()` before it reads anything. Worth
		 * knowing beyond the test: the same applies to any code that polls the map during a switch.
		 */
		await until(() => {
			if (!map.isStyleLoaded()) return false;
			return JSON.stringify(map.getPaintProperty('background', 'background-color')) !== JSON.stringify(before);
		}, 'the new style to be applied');

		expect(JSON.stringify(map.getPaintProperty('background', 'background-color'))).not.toBe(JSON.stringify(before));
	});
});
