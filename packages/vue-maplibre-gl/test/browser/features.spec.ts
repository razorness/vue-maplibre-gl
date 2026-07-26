import type { Map as MaplibreMap } from 'maplibre-gl';
import { afterEach, describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref, useTemplateRef } from 'vue';
import MglSymbolLayer from 'components/layers/MglSymbolLayer.vue';
import MglMarker from 'components/MglMarker.vue';
import MglPopup from 'components/MglPopup.vue';
import MglGeoJsonSource from 'components/sources/MglGeoJsonSource.vue';
import { useLayer } from 'composable/useLayer';
import { useMglMap } from 'composable/useMglMap';
import { useSource } from 'composable/useSource';
import { setPrimaryLanguage } from 'lib/language';
import { useMap } from 'lib/mapRegistry';
import { DrawMode, DrawPlugin, MglDrawControl } from 'plugins/draw';
import { cleanupMounted, mountBare, mountMap, until } from './helpers';
import { blankStyle, points } from './style';

/*
 * The remaining base features, against real maplibre: marker and popup, the composable API, the map
 * registry, language switching and the draw plugin.
 */

afterEach(cleanupMounted);

describe('marker and popup', () => {
	it('places a marker with custom content', async () => {
		await mountMap(() => [h(MglMarker, { coordinates: [7.1, 50.7] }, { default: () => h('span', { class: 'e2e-pin' }, 'pin') })]);
		await until(() => !!document.querySelector('.maplibregl-marker .e2e-pin'), 'the marker content');

		const marker = document.querySelector('.maplibregl-marker') as HTMLElement;
		// maplibre positions the element it owns, which is only observable in a real browser
		expect(marker.style.transform).toContain('translate');
	});

	it('follows a coordinate change', async () => {
		const coordinates = ref<[number, number]>([7.1, 50.7]);
		const { rerender } = await mountMap(() => [h(MglMarker, { coordinates: coordinates.value } as never)]);
		await until(() => !!document.querySelector('.maplibregl-marker'), 'the marker');
		const before = (document.querySelector('.maplibregl-marker') as HTMLElement).style.transform;

		coordinates.value = [13.4, 52.5];
		await rerender();
		await until(() => (document.querySelector('.maplibregl-marker') as HTMLElement).style.transform !== before, 'the marker to move');

		expect((document.querySelector('.maplibregl-marker') as HTMLElement).style.transform).not.toBe(before);
	});

	it('opens a standalone popup', async () => {
		await mountMap(() => [h(MglPopup, { coordinates: [7.1, 50.7] }, { default: () => h('b', { class: 'e2e-popup' }, 'Bonn') })]);
		await until(() => !!document.querySelector('.maplibregl-popup .e2e-popup'), 'the popup content');

		expect(document.querySelector('.maplibregl-popup .e2e-popup')?.textContent).toBe('Bonn');
	});

	it('keeps a nested popup closed until the marker is clicked', async () => {
		await mountMap(() => [
			h(MglMarker, { coordinates: [7.1, 50.7] }, { popup: () => h(MglPopup, null, { default: () => h('b', 'nested') }) })
		]);
		await until(() => !!document.querySelector('.maplibregl-marker'), 'the marker');

		// maplibre toggles a marker's popup, so it must not be on the map yet
		expect(document.querySelector('.maplibregl-popup')).toBeNull();

		(document.querySelector('.maplibregl-marker') as HTMLElement).click();
		await until(() => !!document.querySelector('.maplibregl-popup'), 'the popup to open');
		expect(document.querySelector('.maplibregl-popup')).not.toBeNull();
	});
});

describe('composables', () => {
	it('useMglMap runs the whole lifecycle against a container you own', async () => {
		const map = ref<MaplibreMap>();
		const component = defineComponent({
			setup() {
				const container = useTemplateRef<HTMLDivElement>('c');
				const { map: instance, isLoaded } = useMglMap({
					container,
					options: () => ({ style: blankStyle, center: [7, 50], zoom: 4 })
				});
				return () => [
					h('div', { ref: 'c', style: 'width: 300px; height: 200px' }),
					isLoaded.value && instance.value ? ((map.value = instance.value), null) : null
				];
			}
		});
		mountBare(component);

		await until(() => !!map.value, 'the map from useMglMap', 25_000);
		expect(map.value!.getZoom()).toBeCloseTo(4, 5);
	});

	/*
	 * The layer lives in a **child** component on purpose: `useSource()` hands its id down with
	 * `provide()`, which reaches descendants and not the component that called it. In one setup the layer
	 * has to name its source explicitly — the composable says so rather than guessing.
	 */
	it('useSource and useLayer add to the enclosing map', async () => {
		const layerChild = defineComponent({
			setup() {
				useLayer({ layerId: 'composable-layer', type: 'circle', options: () => ({ paint: { 'circle-radius': 5 } }) });
				return () => null;
			}
		});
		const child = defineComponent({
			setup() {
				useSource({ sourceId: 'composable-src', type: 'geojson', options: () => ({ data: points }) });
				return () => h(layerChild);
			}
		});

		const { map } = await mountMap(() => [h(child)]);
		await until(() => !!map.getLayer('composable-layer'), 'the layer from useLayer');

		expect(map.getSource('composable-src')).toBeDefined();
		expect(map.getLayer('composable-layer')!.type).toBe('circle');
	});

	it('useMap finds the map through the global registry', async () => {
		const seen = ref<MaplibreMap>();
		const child = defineComponent({
			setup() {
				const entry = useMap();
				return () => {
					if (entry.map) seen.value = entry.map;
					return null;
				};
			}
		});

		await mountMap(() => [h(child)]);
		await until(() => !!seen.value, 'the registry entry');

		expect(seen.value!.getCanvas()).toBeDefined();
	});
});

describe('language switching', () => {
	it('rewrites a symbol layer text-field on the live map', async () => {
		const { map } = await mountMap(() => [
			h(MglGeoJsonSource, { sourceId: 'src', data: points } as never, {
				default: () => [
					h(MglSymbolLayer, { layerId: 'labels', layout: { 'text-field': ['get', 'name'], 'text-font': [] } } as never)
				]
			})
		]);
		await until(() => !!map.getLayer('labels'), 'the symbol layer');

		setPrimaryLanguage(map, 'de');

		expect(JSON.stringify(map.getLayoutProperty('labels', 'text-field'))).toContain('name:de');
	});
});

describe('draw plugin', () => {
	it('sets its source and layers up on a real map', async () => {
		const { map } = await mountMap(() => [h(MglDrawControl, null)]);
		await until(() => !!map.getSource(DrawPlugin.SOURCE_ID), 'the draw source');

		expect(map.getSource(DrawPlugin.SOURCE_ID)).toBeDefined();
		expect(document.querySelectorAll('button.maplibregl-draw-control')).toHaveLength(3);
	});

	it('switches between all three modes', async () => {
		await mountMap(() => [h(MglDrawControl, null)]);
		await until(() => document.querySelectorAll('button.maplibregl-draw-control').length === 3, 'the mode buttons');
		const buttons = [...document.querySelectorAll('button.maplibregl-draw-control')] as HTMLButtonElement[];

		for (const [index, mode] of [DrawMode.POLYGON, DrawMode.CIRCLE, DrawMode.CIRCLE_STATIC].entries()) {
			buttons[index]!.click();
			await nextTick();
			expect(buttons[index]!.className).toContain('is-active');
			expect(mode).toBeDefined();
		}
	});

	it('renders the static circle overlay into the canvas container', async () => {
		const { map } = await mountMap(() => [h(MglDrawControl, { mode: DrawMode.CIRCLE_STATIC } as never)]);
		await until(() => !!map.getCanvasContainer().querySelector('.maplibregl-draw-circle-mode'), 'the overlay');

		expect(map.getCanvasContainer().querySelector('.maplibregl-draw-circle-mode')).not.toBeNull();
	});
});
