import { mount } from '@vue/test-utils';
import type { Feature, Polygon } from 'geojson';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { h, nextTick } from 'vue';
import MglMap from 'components/MglMap.vue';
import { DrawMode, DrawPlugin, type DrawFeatureProperties } from 'plugins/draw';
import MglDrawControl from 'plugins/draw/MglDrawControl.vue';
import { DefaultDrawStyles } from 'plugins/draw/styles';
import { FakeMap } from '@test/fake-map';

/*
 * `MglDrawControl` is the Vue wrapper around `DrawPlugin` and doubles as the reference example for using
 * the plugin standalone. Its job is narrow — wire props to setters, wrap the instance in
 * `shallowReactive` so `draw.mode` renders, and tear the plugin down on unmount — and every one of those
 * is a place where a prop can quietly stop being forwarded.
 */

let mounted: Array<{ unmount: () => void }> = [];

beforeEach(() => {
	FakeMap.reset();
	mounted = [];
});

afterEach(() => {
	for (const wrapper of mounted) wrapper.unmount();
});

async function mountControl(props: Record<string, unknown> = {}, slots?: Record<string, unknown>) {
	const wrapper = mount(MglMap, {
		props: { mapStyle: 'test-style' },
		slots: { default: () => [h(MglDrawControl, props as never, slots as never)] },
		attachTo: document.body
	});
	mounted.push(wrapper);
	await nextTick();
	const map = FakeMap.last;
	map.emitLoad();
	await nextTick();
	await nextTick();
	return { wrapper, map };
}

const drawOf = (wrapper: ReturnType<typeof mount>) =>
	(wrapper.findComponent(MglDrawControl) as unknown as { vm: { draw: DrawPlugin } }).vm.draw;

const buttons = () => [...document.body.querySelectorAll('button.maplibregl-draw-control')] as HTMLButtonElement[];

const square: Feature<Polygon, DrawFeatureProperties> = {
	type: 'Feature',
	properties: { meta: 'polygon' },
	geometry: {
		type: 'Polygon',
		coordinates: [
			[
				[0, 0],
				[1, 0],
				[1, 1],
				[0, 1],
				[0, 0]
			]
		]
	}
};

describe('MglDrawControl', () => {
	it('sets the plugin up on the map', async () => {
		const { map } = await mountControl();

		expect(map.getSource(DrawPlugin.SOURCE_ID)).toBeDefined();
		expect(DefaultDrawStyles.every(style => map.getLayer(style.id))).toBe(true);
	});

	it('renders one button per built-in mode', async () => {
		await mountControl();

		expect(buttons()).toHaveLength(3);
	});

	it('switches mode when a button is clicked', async () => {
		const { wrapper } = await mountControl();
		const draw = drawOf(wrapper);

		buttons()[1]!.click();
		await nextTick();

		expect(draw.mode).toBe(DrawMode.CIRCLE);
	});

	/* Clicking the active mode again goes back to `defaultMode` — the button is a toggle, not a radio. */
	it('toggles back to the default mode on a second click', async () => {
		const { wrapper } = await mountControl({ defaultMode: DrawMode.POLYGON });
		const draw = drawOf(wrapper);

		buttons()[1]!.click();
		await nextTick();
		expect(draw.mode).toBe(DrawMode.CIRCLE);

		buttons()[1]!.click();
		await nextTick();
		expect(draw.mode).toBe(DrawMode.POLYGON);
	});

	it('marks the active mode on its button', async () => {
		await mountControl();

		buttons()[2]!.click();
		await nextTick();

		expect(buttons()[2]!.className).toContain('is-active');
		expect(buttons()[0]!.className).not.toContain('is-active');
	});

	it('emits update:mode', async () => {
		const updates: unknown[] = [];
		await mountControl({ 'onUpdate:mode': (mode: unknown) => updates.push(mode) });

		buttons()[1]!.click();
		await nextTick();

		expect(updates).toEqual([DrawMode.CIRCLE]);
	});

	it('passes the initial model into the plugin', async () => {
		const { map } = await mountControl({ model: square });

		const source = map.getSource(DrawPlugin.SOURCE_ID) as unknown as { setDataCalls: unknown[] };
		const data = source.setDataCalls.at(-1) as { features: Feature<Polygon, DrawFeatureProperties>[] };
		expect(data.features[0]!.geometry.coordinates[0]).toHaveLength(5);
	});

	it('forwards a replacement style array', async () => {
		const { map } = await mountControl({ styles: [{ id: 'only-fill', type: 'fill', paint: { 'fill-color': '#000' } }] });

		expect(map.getLayer('only-fill')).toBeDefined();
		expect(map.getLayer(DefaultDrawStyles[0]!.id)).toBeUndefined();
	});

	it('reports a drawn feature through update:model', async () => {
		const updates: unknown[] = [];
		const { map } = await mountControl({ 'onUpdate:model': (model: unknown) => updates.push(model) });

		// draw a triangle: click, move, click, move, click, double click
		const at = (lng: number, lat: number) => ({
			lngLat: { lng, lat, toArray: () => [lng, lat] },
			point: { x: lng * FakeMap.PROJECTION_SCALE, y: -lat * FakeMap.PROJECTION_SCALE },
			originalEvent: { ctrlKey: false },
			preventDefault: () => {}
		});
		vi.useFakeTimers();
		map.fire('click', at(0, 0));
		map.fire('mousemove', at(20, 0));
		vi.advanceTimersByTime(20);
		map.fire('click', at(20, 0));
		map.fire('mousemove', at(20, 20));
		vi.advanceTimersByTime(20);
		map.fire('click', at(20, 20));
		map.fire('dblclick', at(20, 20));
		vi.useRealTimers();

		expect(updates).toHaveLength(1);
	});

	it('lets a slot replace the buttons', async () => {
		await mountControl({}, { buttons: () => h('button', { class: 'my-own' }, 'draw') });
		await nextTick();

		expect(buttons()).toHaveLength(0);
		expect(document.body.querySelector('button.my-own')).not.toBeNull();
	});

	it('disposes the plugin on unmount', async () => {
		const { map } = await mountControl();
		expect(map.getSource(DrawPlugin.SOURCE_ID)).toBeDefined();

		for (const wrapper of mounted) wrapper.unmount();
		mounted = [];

		expect(map.getSource(DrawPlugin.SOURCE_ID)).toBeUndefined();
	});
});
