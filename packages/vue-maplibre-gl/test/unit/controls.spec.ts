import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
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
import MglMap from 'components/MglMap.vue';
import { FakeMap } from '@test/fake-map';

/*
 * Controls are the one component family that has to render, and none of them removes itself:
 * `usePositionWatcher` owns add, move and remove for all eleven. That shared ownership is what these
 * tests are really about — a control that added itself twice, or forgot to leave, would leak into the
 * next map.
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
	return { map, wrapper };
}

const CONTROLS: Array<[string, Component, Record<string, unknown>]> = [
	['MglAttributionControl', MglAttributionControl, {}],
	['MglCustomControl', MglCustomControl, {}],
	['MglFrameRateControl', MglFrameRateControl, {}],
	['MglFullscreenControl', MglFullscreenControl, {}],
	['MglGeolocationControl', MglGeolocationControl, {}],
	['MglGlobeControl', MglGlobeControl, {}],
	['MglLogoControl', MglLogoControl, {}],
	['MglNavigationControl', MglNavigationControl, {}],
	['MglScaleControl', MglScaleControl, {}],
	['MglStyleSwitchControl', MglStyleSwitchControl, { mapStyles: [{ name: 'a', label: 'A', style: 'a.json' }] }],
	['MglTerrainControl', MglTerrainControl, { source: 'dem' }]
];

describe.each(CONTROLS)('%s', (_name, component, props) => {
	it('adds exactly one control to the map', async () => {
		const { map } = await mountMap(() => [h(component as never, props as never)]);

		expect(map.controls).toHaveLength(1);
	});

	it('removes it again on unmount', async () => {
		const { map, wrapper } = await mountMap(() => [h(component as never, props as never)]);
		expect(map.controls).toHaveLength(1);

		wrapper.unmount();
		mounted = [];
		await nextTick();

		expect(map.controls).toHaveLength(0);
	});

	it('moves rather than duplicates when the position changes', async () => {
		const { map, wrapper } = await mountMap(() => [h(component as never, { ...props, position: 'top-left' } as never)]);
		expect(map.controls).toHaveLength(1);

		await wrapper.setProps({});
		await nextTick();

		expect(map.controls).toHaveLength(1);
	});
});

describe('MglCustomControl', () => {
	it('teleports its slot into the control container', async () => {
		await mountMap(() => [h(MglCustomControl, null, { default: () => h('span', { class: 'custom-marker' }, 'hi') })]);
		await nextTick();

		expect(document.body.querySelector('.custom-marker')).not.toBeNull();
	});
});

describe('MglStyleSwitchControl', () => {
	/*
	 * The control is the only thing that broadcasts `styleSwitched`, which is what resets the source
	 * handles so layers wait instead of touching sources that a style switch threw away. Clicking a style
	 * therefore has to reach the map *and* leave the tree in a state where a layer comes back.
	 */
	it('sets the chosen style on the map when its button is clicked', async () => {
		const styles = [
			{ name: 'a', label: 'A', style: 'a.json' },
			{ name: 'b', label: 'B', style: 'b.json' }
		];
		const { map } = await mountMap(() => [h(MglStyleSwitchControl, { mapStyles: styles } as never)]);

		const buttons = [...document.body.querySelectorAll('button')];
		expect(buttons.length).toBeGreaterThan(0);

		// the first button opens the list, the ones after it are the styles
		buttons[0]!.click();
		await nextTick();
		const styleButtons = [...document.body.querySelectorAll('button')].slice(1);
		expect(styleButtons.length).toBeGreaterThan(0);

		styleButtons.at(-1)!.click();
		await nextTick();

		expect(map.style).toEqual({ name: 'b.json' });
	});
});
