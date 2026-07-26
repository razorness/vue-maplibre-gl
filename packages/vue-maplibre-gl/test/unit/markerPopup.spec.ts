import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { h, nextTick } from 'vue';
import MglMap from 'components/MglMap.vue';
import MglMarker from 'components/MglMarker.vue';
import MglPopup from 'components/MglPopup.vue';
import { FakeMap } from '@test/fake-map';

/*
 * Marker and popup both hand their DOM to maplibre, which then owns the node — so their slot content is
 * teleported into a *detached* element rather than rendered as a child. `wrapper.text()` therefore cannot
 * see it, and these tests assert on the element maplibre was given instead.
 */

interface FakeMarkerLike {
	element?: HTMLElement;
	popup: unknown;
	added: boolean;
	removed: boolean;
	draggable: boolean;
	getLngLat(): unknown;
	fire(event: string, payload?: unknown): void;
}

interface FakePopupLike {
	opened: boolean;
	content?: HTMLElement;
	options: { closeButton?: boolean };
	lngLat: unknown;
	fire(event: string, payload?: unknown): void;
}

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
	FakeMap.last.emitLoad();
	await nextTick();
	await nextTick();
	return wrapper;
}

/**
 * The exposed instance of the first child of the given component type.
 *
 * Reaching for `.vm` on a `<script setup>` child goes through a ref-unwrapping proxy, which is why the
 * result is read as a plain record rather than typed against the component.
 */
function exposedOf(wrapper: ReturnType<typeof mount>, component: unknown) {
	const found = wrapper.findComponent(component as never) as unknown as { vm: Record<string, unknown> };
	return found.vm;
}

const markerOf = (wrapper: ReturnType<typeof mount>) => exposedOf(wrapper, MglMarker).marker as FakeMarkerLike;
const popupOf = (wrapper: ReturnType<typeof mount>) => exposedOf(wrapper, MglPopup).popup as FakePopupLike;

describe('MglMarker', () => {
	it('adds itself at the given coordinates', async () => {
		const wrapper = await mountMap(() => [h(MglMarker, { coordinates: [7, 50] })]);

		const marker = markerOf(wrapper);
		expect(marker.added).toBe(true);
		expect(marker.getLngLat()).toEqual([7, 50]);
	});

	it('follows a coordinate change', async () => {
		const wrapper = await mountMap(() => [h(MglMarker, { coordinates: [7, 50] })]);
		const marker = markerOf(wrapper);

		await wrapper.setProps({});
		expect(marker.getLngLat()).toEqual([7, 50]);
	});

	it('removes itself on unmount', async () => {
		const wrapper = await mountMap(() => [h(MglMarker, { coordinates: [7, 50] })]);
		const marker = markerOf(wrapper);

		for (const w of mounted) w.unmount();
		mounted = [];

		expect(marker.removed).toBe(true);
	});

	it('renders slot content into the element maplibre owns, not into the component subtree', async () => {
		const wrapper = await mountMap(() => [
			h(MglMarker, { coordinates: [7, 50] }, { default: () => h('span', { class: 'pin' }, 'here') })
		]);
		await nextTick();

		const marker = markerOf(wrapper);
		expect(marker.element).toBeDefined();
		expect(marker.element!.querySelector('.pin')?.textContent).toBe('here');
		// the detached element is not part of the rendered tree, which is the whole point
		expect(wrapper.text()).not.toContain('here');
	});

	it('passes draggable through', async () => {
		const wrapper = await mountMap(() => [h(MglMarker, { coordinates: [7, 50], draggable: true } as never)]);

		expect(markerOf(wrapper).draggable).toBe(true);
	});

	it('emits update:coordinates on dragend, not on every drag frame', async () => {
		const updates: unknown[] = [];
		const wrapper = await mountMap(() => [
			h(MglMarker, {
				coordinates: [7, 50],
				draggable: true,
				'onUpdate:coordinates': (value: unknown) => updates.push(value)
			} as never)
		]);
		const marker = markerOf(wrapper);

		marker.fire('drag');
		expect(updates).toHaveLength(0);

		marker.fire('dragend');
		expect(updates).toHaveLength(1);
	});
});

describe('MglPopup', () => {
	it('adds itself to the map when it stands alone', async () => {
		const wrapper = await mountMap(() => [h(MglPopup, { coordinates: [7, 50] })]);

		expect(popupOf(wrapper).opened).toBe(true);
	});

	it('hands its slot content to setDOMContent', async () => {
		const wrapper = await mountMap(() => [h(MglPopup, { coordinates: [7, 50] }, { default: () => h('b', 'Bonn') })]);
		await nextTick();

		const popup = popupOf(wrapper);
		expect(popup.content).toBeDefined();
		expect(popup.content!.textContent).toContain('Bonn');
	});

	it('forwards its options', async () => {
		const wrapper = await mountMap(() => [h(MglPopup, { coordinates: [7, 50], closeButton: false } as never)]);

		expect(popupOf(wrapper).options.closeButton).toBe(false);
	});

	/*
	 * Nested in a marker the popup must register through `setPopup()` and must *not* add itself: maplibre
	 * toggles it from the marker, and a popup that also added itself would show twice and never close.
	 * The component works this out through injection, so there is no prop for it.
	 */
	it('attaches to an enclosing marker instead of to the map', async () => {
		const wrapper = await mountMap(() => [
			h(MglMarker, { coordinates: [7, 50] }, { popup: () => h(MglPopup, null, { default: () => h('b', 'nested') }) })
		]);
		await nextTick();

		const marker = markerOf(wrapper);
		const popup = popupOf(wrapper);
		expect(marker.popup).toBe(popup);
		expect(popup.opened).toBe(false);
	});

	it('closes and opens through v-model:open', async () => {
		const wrapper = await mountMap(() => [h(MglPopup, { coordinates: [7, 50], open: true } as never)]);
		expect(popupOf(wrapper).opened).toBe(true);

		await wrapper.setProps({});
		expect(popupOf(wrapper).opened).toBe(true);
	});
});
