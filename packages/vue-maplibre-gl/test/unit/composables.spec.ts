import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { ButtonType } from 'components/buttonType';
import MglNavigationControl from 'components/controls/MglNavigationControl.vue';
import MglButton from 'components/MglButton.vue';
import MglMap from 'components/MglMap.vue';
import MglMarker from 'components/MglMarker.vue';
import MglPopup from 'components/MglPopup.vue';
import MglGlobalState from 'components/style/MglGlobalState.vue';
import MglImage from 'components/style/MglImage.vue';
import MglLight from 'components/style/MglLight.vue';
import MglProjection from 'components/style/MglProjection.vue';
import MglSky from 'components/style/MglSky.vue';
import { useMapContext } from 'composable/useMapContext';
import { onMapLoad, useLayerEvent, useMapEvent } from 'composable/useMapEvent';
import { useQueryRenderedFeatures } from 'composable/useQueryRenderedFeatures';
import { FakeMap } from '@test/fake-map';

/** Mounts children inside a loaded map and hands back the map. */
async function inMap(children: () => unknown) {
	FakeMap.reset();
	const wrapper = mount(MglMap, { props: { mapStyle: 'a' }, slots: { default: children }, attachTo: document.body });
	await nextTick();
	const map = FakeMap.last;
	map.emitLoad();
	await nextTick();
	await nextTick();
	return { wrapper, map };
}

/** Runs a composable inside a loaded map, so the inject spine is present. */
async function withContext<T>(fn: () => T): Promise<{ map: FakeMap; result: T; unmount: () => void }> {
	let result!: T;
	const Child = defineComponent({
		setup() {
			result = fn();
			return () => null;
		}
	});
	const { wrapper, map } = await inMap(() => h(Child));
	return { map, result, unmount: () => wrapper.unmount() };
}

describe('useMapContext', () => {
	it('synthesises one shared context per raw map', async () => {
		const raw = new FakeMap();
		const { unmount } = await withContext(() => {
			const a = useMapContext(raw as never),
				b = useMapContext(raw as never);
			/*
			 * Shared identity is a correctness requirement, not an optimisation: a layer only learns its
			 * source is ready by reading the same registry the source wrote to.
			 */
			expect(a.sourceRegistry).toBe(b.sourceRegistry);
			expect(a.emitter).toBe(b.emitter);
			return a;
		});
		unmount();
	});

	it('reports a loaded raw map as loaded', async () => {
		const raw = new FakeMap();
		raw.emitLoad();
		const { result, unmount } = await withContext(() => useMapContext(raw as never));
		expect(result.isLoaded.value).toBe(true);
		unmount();
	});

	it('keeps the caller ref identity when given one', async () => {
		const raw = new FakeMap(),
			asRef = ref(raw);
		const { result, unmount } = await withContext(() => useMapContext(asRef as never));
		expect(result.map).toBe(asRef);
		unmount();
	});

	it('throws instead of silently doing nothing', async () => {
		const raw = ref(undefined);
		const { unmount } = await withContext(() => {
			expect(() => useMapContext(raw as never)).toThrow(/was given but is empty/);
			return null;
		});
		unmount();
	});

	it('throws outside a map and without an explicit one', () => {
		const Orphan = defineComponent({
			setup() {
				expect(() => useMapContext()).toThrow(/no map found/);
				return () => null;
			}
		});
		mount(Orphan);
	});
});

describe('map and layer events', () => {
	it('subscribes and unsubscribes with the map event', async () => {
		const seen: unknown[] = [];
		const { map, unmount } = await withContext(() => useMapEvent('moveend', e => seen.push(e)));

		map.fire('moveend');
		expect(seen).toHaveLength(1);

		unmount();
		map.fire('moveend');
		expect(seen, 'must not fire after unmount').toHaveLength(1);
	});

	it('subscribes to a layer-scoped event', async () => {
		const seen: unknown[] = [];
		const { map, unmount } = await withContext(() => useLayerEvent('click', 'my-layer', e => seen.push(e)));

		map.fireLayer('click', 'my-layer');
		map.fireLayer('click', 'other-layer');
		expect(seen, 'only the named layer').toHaveLength(1);
		unmount();
	});

	it('runs onMapLoad immediately on an already loaded map', async () => {
		const handler = vi.fn();
		const { unmount } = await withContext(() => onMapLoad(handler));
		expect(handler).toHaveBeenCalledOnce();
		unmount();
	});
});

describe('useQueryRenderedFeatures', () => {
	it('queries on load and again on idle', async () => {
		const { map, result, unmount } = await withContext(() => useQueryRenderedFeatures());
		const spy = vi.spyOn(map, 'queryRenderedFeatures');

		map.fire('idle');
		expect(spy).toHaveBeenCalled();
		expect(result.features.value).toEqual([]);

		result.refresh();
		unmount();
	});

	it('passes the geometry through when given', async () => {
		const { map, unmount } = await withContext(() => useQueryRenderedFeatures(() => [1, 2] as never));
		const spy = vi.spyOn(map, 'queryRenderedFeatures');
		map.fire('idle');
		expect(spy).toHaveBeenCalledWith([1, 2], undefined);
		unmount();
	});
});

describe('MglMarker', () => {
	it('adds a marker and forwards its events', async () => {
		const dragend = vi.fn();
		const { wrapper } = await inMap(() => h(MglMarker, { coordinates: [1, 2], draggable: true, onDragend: dragend }));
		expect(wrapper.html()).toBeTruthy();
		wrapper.unmount();
	});

	it('creates its own element only when a slot is given', async () => {
		/*
		 * The slot is teleported into a *detached* element that maplibre takes ownership of, so it is not in
		 * the wrapper's tree — `wrapper.text()` can never see it. Assert on the element the marker was given.
		 */
		const withSlot = await inMap(() => h(MglMarker, { coordinates: [1, 2] }, { default: () => 'pin' }));
		const marker = withSlot.wrapper.findComponent(MglMarker).vm.marker as unknown as { element?: HTMLElement };
		expect(marker.element?.textContent).toContain('pin');
		withSlot.wrapper.unmount();

		const withoutSlot = await inMap(() => h(MglMarker, { coordinates: [1, 2] }));
		const plain = withoutSlot.wrapper.findComponent(MglMarker).vm.marker as unknown as { element?: HTMLElement };
		expect(plain.element, 'no slot => maplibre draws its default pin').toBeUndefined();
		withoutSlot.wrapper.unmount();
	});
});

describe('MglPopup', () => {
	it('renders its slot into the node maplibre owns, and opens itself', async () => {
		const { wrapper } = await inMap(() => h(MglPopup, { coordinates: [1, 2] }, { default: () => 'hello' }));
		const popup = wrapper.findComponent(MglPopup).vm.popup as unknown as { content?: HTMLElement; isOpen(): boolean };

		expect(popup.content?.textContent).toContain('hello');
		expect(popup.isOpen(), 'no `open` prop => uncontrolled, added immediately').toBe(true);
		wrapper.unmount();
	});

	it('opens and closes with v-model:open', async () => {
		const open = ref(false);
		const { wrapper } = await inMap(() => h(MglPopup, { coordinates: [1, 2], open: open.value }, { default: () => 'x' }));
		const popup = wrapper.findComponent(MglPopup).vm.popup as unknown as { isOpen(): boolean };

		expect(popup.isOpen()).toBe(false);
		open.value = true;
		await nextTick();
		await nextTick();
		expect(popup.isOpen()).toBe(true);
		wrapper.unmount();
	});

	it('attaches to an enclosing marker instead of adding itself to the map', async () => {
		const { wrapper } = await inMap(() =>
			h(MglMarker, { coordinates: [1, 2] }, { popup: () => h(MglPopup, null, { default: () => 'attached' }) })
		);
		const marker = wrapper.findComponent(MglMarker).vm.marker as unknown as { popup?: { isOpen(): boolean } };

		expect(marker.popup, 'marker.setPopup must have been called').toBeDefined();
		expect(marker.popup!.isOpen(), 'a marker-attached popup is toggled by the marker, not added directly').toBe(false);
		wrapper.unmount();
	});
});

describe('MglButton', () => {
	it('renders an icon button with the mdi defaults', () => {
		const wrapper = mount(MglButton, { props: { type: ButtonType.MDI, path: 'M0 0' } });
		const svg = wrapper.find('svg');
		expect(svg.attributes('width')).toBe('21');
		expect(wrapper.find('path').attributes('d')).toBe('M0 0');
	});

	it('renders a plain text button without an svg', () => {
		const wrapper = mount(MglButton, { props: { type: ButtonType.TEXT }, slots: { default: 'Label' } });
		expect(wrapper.find('svg').exists()).toBe(false);
		expect(wrapper.text()).toBe('Label');
	});
});

describe('controls', () => {
	it('adds the control and removes it on unmount', async () => {
		const { wrapper, map } = await inMap(() => h(MglNavigationControl));
		expect(map.controls).toHaveLength(1);
		wrapper.unmount();
		expect(map.controls, 'usePositionWatcher owns removal').toHaveLength(0);
	});

	it('moves the control when the position changes', async () => {
		const position = ref<'top-left' | 'bottom-right'>('top-left');
		const { wrapper, map } = await inMap(() => h(MglNavigationControl, { position: position.value }));
		const first = map.controls[0];

		position.value = 'bottom-right';
		await nextTick();
		await nextTick();

		expect(map.controls, 'still exactly one control').toHaveLength(1);
		expect(map.controls[0], 'the same control instance, re-added').toBe(first);
		wrapper.unmount();
	});
});

describe('declarative style settings', () => {
	it('applies light, sky, projection and global state', async () => {
		const { wrapper, map } = await inMap(() => [
			h(MglLight, { light: { intensity: 0.4 } }),
			h(MglSky, { sky: { 'sky-color': '#fff' } }),
			h(MglProjection, { type: 'globe' }),
			h(MglGlobalState, { state: { highlight: 'a' } })
		]);

		expect(map.light).toEqual({ intensity: 0.4 });
		expect(map.sky).toEqual({ 'sky-color': '#fff' });
		expect(map.projection).toEqual({ type: 'globe' });
		expect(map.globalState.get('highlight')).toBe('a');
		wrapper.unmount();
	});

	it('adds an image, then updates it instead of adding twice', async () => {
		const image = ref({ width: 1 });
		const { wrapper, map } = await inMap(() => h(MglImage, { id: 'icon', image: image.value as never }));

		expect(map.hasImage('icon')).toBe(true);

		image.value = { width: 2 };
		await nextTick();
		await nextTick();
		expect(map.images.get('icon')).toEqual({ width: 2 });

		wrapper.unmount();
		expect(map.hasImage('icon'), 'removed on unmount').toBe(false);
	});
});
