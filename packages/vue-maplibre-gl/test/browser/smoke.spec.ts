import type { Map as MaplibreMap } from 'maplibre-gl';
import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-vue';
import { defineComponent, h, nextTick, ref, shallowRef, type Ref } from 'vue';
import MglNavigationControl from 'components/controls/MglNavigationControl.vue';
import MglCircleLayer from 'components/layers/MglCircleLayer.vue';
import MglFillLayer from 'components/layers/MglFillLayer.vue';
import MglMap from 'components/MglMap.vue';
import MglMarker from 'components/MglMarker.vue';
import MglGeoJsonSource from 'components/sources/MglGeoJsonSource.vue';
import { blankStyle, otherStyle, points, polygon } from './style';

/*
 * Smoke tests against **real** maplibre in real Chromium with a software WebGL context.
 *
 * Everything else in this suite mocks maplibre, which means nothing else can notice when maplibre changes
 * the shape of its API — a renamed option, a setter that starts returning a promise, an event that stops
 * firing. That is what these tests are for, and it is why they are deliberately few: they cover the paths
 * where this library talks to maplibre, not the library's own logic.
 *
 * No tile server is involved (see ./style.ts), so they work offline.
 */

let cleanups: Array<() => void> = [];

afterEach(() => {
	for (const cleanup of cleanups) cleanup();
	cleanups = [];
});

/**
 * Mounts a component and resolves once maplibre has fired `load` — which is signalled by the component
 * assigning `mapRef` in its `@map:load` handler.
 *
 * Deliberately *not* `map.loaded()`: that also requires the map to be idle, and with a software WebGL
 * renderer it stays dirty, so it never returns true and every test here timed out while the library was
 * working perfectly well.
 */
async function mountAndLoad(component: ReturnType<typeof defineComponent>, mapRef: Ref<MaplibreMap | undefined>) {
	const screen = render(component);
	cleanups.push(() => screen.unmount());

	await until(() => !!mapRef.value, 'maplibre to fire load — is WebGL available?', 20_000);
	await nextTick();
	return { screen, map: mapRef.value! };
}

/** Waits for a condition that maplibre reaches asynchronously (a style load, a re-add). */
async function until(predicate: () => boolean, message: string, timeout = 10_000) {
	const deadline = Date.now() + timeout;
	while (!predicate()) {
		if (Date.now() > deadline) throw new Error(`timed out waiting for: ${message}`);
		await new Promise(resolve => setTimeout(resolve, 50));
	}
}

describe('a real map', () => {
	it('initialises, fires load and reports the options it was given', async () => {
		const map = shallowRef<MaplibreMap>();
		const loads = ref(0);

		const component = defineComponent({
			setup() {
				return () =>
					h(MglMap, {
						mapStyle: blankStyle,
						center: [7.1, 50.7],
						zoom: 5,
						style: 'width: 400px; height: 300px',
						'onMap:load': (event: { map: MaplibreMap }) => {
							map.value = event.map;
							loads.value++;
						}
					} as never);
			}
		});

		const screen = render(component);
		cleanups.push(() => screen.unmount());
		await until(() => loads.value > 0, 'map:load');

		// the payload is an MglEvent, so the map comes with the event rather than through a ref
		expect(map.value).toBeDefined();
		expect(map.value!.getZoom()).toBeCloseTo(5, 5);
		expect(map.value!.getCenter().lng).toBeCloseTo(7.1, 5);
		expect(map.value!.getCanvas().width).toBeGreaterThan(0);
	});

	it('adds a source and a layer, and removes them in the order maplibre demands', async () => {
		const map = shallowRef<MaplibreMap>();
		const show = ref(true);

		const component = defineComponent({
			setup() {
				return () =>
					h(
						MglMap,
						{
							mapStyle: blankStyle,
							style: 'width: 400px; height: 300px',
							'onMap:load': (event: { map: MaplibreMap }) => (map.value = event.map)
						} as never,
						{
							default: () =>
								show.value
									? [
											h(MglGeoJsonSource, { sourceId: 'pts', data: points } as never, {
												default: () => [
													h(MglCircleLayer, { layerId: 'dots', paint: { 'circle-radius': 6 } } as never)
												]
											})
										]
									: []
						}
					);
			}
		});

		const { map: real } = await mountAndLoad(component, map);
		await until(() => !!real.getLayer('dots'), 'the layer to be added');

		expect(real.getSource('pts')).toBeDefined();
		expect(real.getLayer('dots')!.type).toBe('circle');

		// removing the source while the layer still references it throws in real maplibre
		show.value = false;
		await nextTick();
		await until(() => !real.getLayer('dots') && !real.getSource('pts'), 'both to be removed');

		expect(real.getLayer('dots')).toBeUndefined();
		expect(real.getSource('pts')).toBeUndefined();
	});

	it('applies a paint change to the live layer', async () => {
		const map = shallowRef<MaplibreMap>();
		const color = ref('#ff0000');

		const component = defineComponent({
			setup() {
				return () =>
					h(
						MglMap,
						{
							mapStyle: blankStyle,
							style: 'width: 400px; height: 300px',
							'onMap:load': (event: { map: MaplibreMap }) => (map.value = event.map)
						} as never,
						{
							default: () => [
								h(MglGeoJsonSource, { sourceId: 'poly', data: polygon } as never, {
									default: () => [h(MglFillLayer, { layerId: 'shape', paint: { 'fill-color': color.value } } as never)]
								})
							]
						}
					);
			}
		});

		const { map: real } = await mountAndLoad(component, map);
		await until(() => !!real.getLayer('shape'), 'the layer to be added');

		color.value = '#0000ff';
		await nextTick();
		await until(() => JSON.stringify(real.getPaintProperty('shape', 'fill-color')) !== '"#ff0000"', 'the paint change');

		// maplibre normalises a hex colour, so compare what it parsed rather than the string
		expect(JSON.stringify(real.getPaintProperty('shape', 'fill-color'))).not.toContain('ff0000');
	});

	it('brings its layers back after a style switch', async () => {
		const map = shallowRef<MaplibreMap>();
		const style = ref(blankStyle);

		const component = defineComponent({
			setup() {
				return () =>
					h(
						MglMap,
						{
							mapStyle: style.value,
							style: 'width: 400px; height: 300px',
							'onMap:load': (event: { map: MaplibreMap }) => (map.value = event.map)
						} as never,
						{
							default: () => [
								h(MglGeoJsonSource, { sourceId: 'poly', data: polygon } as never, {
									default: () => [h(MglFillLayer, { layerId: 'shape', paint: { 'fill-color': '#f00' } } as never)]
								})
							]
						}
					);
			}
		});

		const { map: real } = await mountAndLoad(component, map);
		await until(() => !!real.getLayer('shape'), 'the layer to be added');

		style.value = otherStyle;
		await nextTick();

		/*
		 * The layer has to be gone and back. This is the sequence the whole library exists to guarantee, and
		 * the one place it can be observed end to end: `setStyle` runs with `{ diff: false }`, maplibre fires
		 * `style.load`, the source re-adds, then the layer.
		 */
		await until(() => !!real.getLayer('shape') && !!real.getSource('poly'), 'the layer to come back');

		expect(real.getLayer('shape')).toBeDefined();
		expect(real.getSource('poly')).toBeDefined();
	});

	it('updates geojson data through the async v6 setData', async () => {
		const map = shallowRef<MaplibreMap>();
		const data = ref(points);

		const component = defineComponent({
			setup() {
				return () =>
					h(
						MglMap,
						{
							mapStyle: blankStyle,
							style: 'width: 400px; height: 300px',
							'onMap:load': (event: { map: MaplibreMap }) => (map.value = event.map)
						} as never,
						{ default: () => [h(MglGeoJsonSource, { sourceId: 'pts', data: data.value } as never)] }
					);
			}
		});

		const { map: real } = await mountAndLoad(component, map);
		await until(() => !!real.getSource('pts'), 'the source to be added');

		data.value = { type: 'FeatureCollection', features: [points.features[0]!] };
		await nextTick();

		// `setData` returns a promise in v6; the source must end up with the new data, not reject
		const source = real.getSource('pts') as { getData?: () => Promise<unknown> };
		expect(source).toBeDefined();
		if (source.getData) {
			const loaded = (await source.getData()) as { features?: unknown[] };
			expect(loaded.features).toHaveLength(1);
		}
	});

	it('renders a marker and a control into the map container', async () => {
		const map = shallowRef<MaplibreMap>();

		const component = defineComponent({
			setup() {
				return () =>
					h(
						MglMap,
						{
							mapStyle: blankStyle,
							style: 'width: 400px; height: 300px',
							'onMap:load': (event: { map: MaplibreMap }) => (map.value = event.map)
						} as never,
						{
							default: () => [
								h(MglNavigationControl, null),
								h(MglMarker, { coordinates: [7.1, 50.7] }, { default: () => h('span', { class: 'e2e-pin' }, 'pin') })
							]
						}
					);
			}
		});

		await mountAndLoad(component, map);
		await until(() => !!document.querySelector('.e2e-pin'), 'the marker slot content');

		expect(document.querySelector('.maplibregl-ctrl-zoom-in')).not.toBeNull();
		// the slot content ends up inside the element maplibre positions
		expect(document.querySelector('.maplibregl-marker .e2e-pin')).not.toBeNull();
	});

	it('emits update:zoom once the camera settles, and not before', async () => {
		const map = shallowRef<MaplibreMap>();
		const zoom = ref(4);
		const updates = ref(0);

		const component = defineComponent({
			setup() {
				return () =>
					h(MglMap, {
						mapStyle: blankStyle,
						zoom: zoom.value,
						style: 'width: 400px; height: 300px',
						'onMap:load': (event: { map: MaplibreMap }) => (map.value = event.map),
						'onUpdate:zoom': (value: number) => {
							updates.value++;
							zoom.value = value;
						}
					} as never);
			}
		});

		const { map: real } = await mountAndLoad(component, map);
		const before = updates.value;

		// a user-driven zoom, not a prop change: this one must come back
		real.zoomTo(7, { duration: 0 });
		await until(() => updates.value > before, 'update:zoom after zoomend');

		expect(real.getZoom()).toBeCloseTo(7, 5);
		expect(zoom.value).toBeCloseTo(7, 5);
	});
});
