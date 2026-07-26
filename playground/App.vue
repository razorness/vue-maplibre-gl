<template>
	<div style="padding: 20px">
		<div class="map-container">
			<mgl-map
				v-if="showMap"
				:fit-bounds-options="defaultBoundsOptions"
				:bounds="bounds"
				:center="center"
				:zoom="zoom"
				language="fr"
				:projection="{ type: 'globe' }"
				@map:load="onLoad"
				@map:zoomstart="isZooming = true"
				@map:zoomend="isZooming = false"
			>
				<mgl-draw-control
					v-if="useDrawPlugin"
					v-model:mode="drawMode"
					position="top-left"
					:model="drawModel"
					auto-zoom
					:min-area-size="800000000"
					min-area-label="TOO SMALL"
					@update:model="onDrawModelUpdate"
				/>
				<mgl-frame-rate-control />
				<mgl-fullscreen-control />
				<mgl-navigation-control />
				<mgl-scale-control />
				<mgl-geolocation-control />
				<mgl-custom-control v-if="showCustomControl" position="top-left" :no-classes="!useClasses">
					<mgl-button type="mdi" :path="buttonIcon" style="color: deepskyblue" />
				</mgl-custom-control>
				<mgl-style-switch-control :map-styles="mapStyles" :position="controlPosition" />

				<mgl-marker :coordinates="markerCoordinates" color="#cc0000" :scale="0.5" />

				<!-- named shim, unchanged API -->
				<mgl-geo-json-source source-id="geojson" :data="geojsonSource.data as any">
					<mgl-line-layer
						v-if="geojsonSource.show"
						layer-id="geojson"
						:layout="layout"
						:paint="paint"
						@mouseenter="onMouseenter"
					/>
				</mgl-geo-json-source>

				<!--
					generic components: `options` is narrowed by `type`. `circleColor` is mutated by a
					button below, which exercises the reactive paint diffing (setPaintProperty on the
					live layer) that was impossible before.
				-->
				<mgl-source source-id="generic-demo" type="geojson" :options="{ data: genericDemoData }">
					<mgl-layer
						layer-id="generic-demo-circles"
						type="circle"
						:options="{
							paint: { 'circle-radius': circleRadius, 'circle-color': circleColor, 'circle-stroke-width': 1 }
						}"
						@click="onGenericLayerClick"
					/>
				</mgl-source>
			</mgl-map>
		</div>
		<div style="margin: 10px 0">
			<strong>Generic component + reactive diffing:</strong>
			<button type="button" @click="circleColor = circleColor === '#3bb2d0' ? '#ff8800' : '#3bb2d0'">toggle colour</button>
			<button type="button" @click="circleRadius = circleRadius === 8 ? 16 : 8">toggle radius</button>
			<span>{{ circleColor }} / {{ circleRadius }}px</span>
		</div>
		<composable-map />
		<div style="margin-bottom: 20px">Version: {{ mapVersion }}</div>
		Loaded Count: {{ loaded }}<br />
		Is Zooming: {{ isZooming }}<br />
		<div>
			<input id="one" v-model="controlPosition" type="radio" value="top-left" />
			<label for="one">top-left</label>
			<br />
			<input id="tw0" v-model="controlPosition" type="radio" value="top-right" />
			<label for="tw0">top-right</label>
			<br />
			<input id="three" v-model="controlPosition" type="radio" value="bottom-left" />
			<label for="three">bottom-left</label>
			<br />
			<input id="four" v-model="controlPosition" type="radio" value="bottom-right" />
			<label for="four">bottom-right</label>
			<br />
			<span>Attribution Position: {{ controlPosition }}</span>
		</div>
		<div>
			<input id="use-draw" v-model="useDrawPlugin" type="checkbox" />
			<label for="use-draw">Use Draw Plugin</label>
		</div>
		<div>
			<input id="noclasses" v-model="useClasses" type="checkbox" />
			<label for="noclasses">Use Custom Control Classes</label>
		</div>
		<div>
			<input id="showcustom" v-model="showCustomControl" type="checkbox" />
			<label for="showcustom">Show Custom Control</label>
		</div>
		<div>
			<input id="showmap" v-model="showMap" type="checkbox" />
			<label for="showmap">Show Map</label>
		</div>
		<div>
			<label for="cars">Language:</label>
			<select :value="map?.language" @input="setLanguage">
				<option value="">n/a</option>
				<option value="de">German</option>
				<option value="en">English</option>
				<option value="fr">French</option>
				<option value="ja">Japanese</option>
			</select>
		</div>
	</div>
</template>

<script lang="ts">
import { mdiCursorDefaultClick } from '@mdi/js';
import type { FeatureCollection, LineString } from 'geojson';
import {
	type CircleLayerSpecification,
	type LineLayerSpecification,
	type LngLatBoundsLike,
	type LngLatLike,
	type MapLayerMouseEvent
} from 'maplibre-gl';
import { defineComponent, onMounted, ref, watch } from 'vue';
import {
	MglButton,
	MglCustomControl,
	MglDefaults,
	MglFrameRateControl,
	MglFullscreenControl,
	MglGeoJsonSource,
	MglGeolocationControl,
	MglLayer,
	MglLineLayer,
	MglMap,
	MglMarker,
	MglNavigationControl,
	MglScaleControl,
	MglSource,
	MglStyleSwitchControl,
	Position,
	useMap,
	type FitBoundsOptions,
	type MglEvent,
	type StyleSwitchItem,
	type ValidLanguages
} from 'vue-maplibre-gl';
import { DrawMode, MglDrawControl, type DrawModel } from 'vue-maplibre-gl/draw';
import ComposableMap from './ComposableMap.vue';
import { drawCircleExample, drawPolygonExample } from './drawData';

/*
 * To use custom style:
 * - create file /dev/.env
 * - add line: VITE_MAP_STYLE=https://..../style.json
 * - rerun dev server
 */
MglDefaults.style = import.meta.env.VITE_MAP_STYLE_KEY
	? 'https://api.maptiler.com/maps/streets-v4/style.json?key=' + import.meta.env.VITE_MAP_STYLE_KEY
	: 'https://demotiles.maplibre.org/style.json';
console.log('MglDefaults', MglDefaults);

const lineString = [
	[-122.483696, 37.833818],
	[-122.483482, 37.833174],
	[-122.483396, 37.8327],
	[-122.483568, 37.832056],
	[-122.48404, 37.831141],
	[-122.48404, 37.830497],
	[-122.483482, 37.82992],
	[-122.483568, 37.829548],
	[-122.48507, 37.829446],
	[-122.4861, 37.828802],
	[-122.486958, 37.82931],
	[-122.487001, 37.830802],
	[-122.487516, 37.831683],
	[-122.488031, 37.832158],
	[-122.488889, 37.832971],
	[-122.489876, 37.832632],
	[-122.490434, 37.832937],
	[-122.49125, 37.832429],
	[-122.491636, 37.832564],
	[-122.492237, 37.833378],
	[-122.493782, 37.833683]
];

export default defineComponent({
	name: 'App',
	components: {
		MglDrawControl,
		ComposableMap,
		MglLayer,
		MglSource,
		MglLineLayer,
		MglGeoJsonSource,
		MglMarker,
		MglStyleSwitchControl,
		MglButton,
		MglCustomControl,
		MglGeolocationControl,
		MglScaleControl,
		MglNavigationControl,
		MglFullscreenControl,
		MglFrameRateControl,
		MglMap
	},
	setup() {
		const map = useMap(),
			mapVersion = ref<string>(),
			/* generic-component demo: mutated by the buttons, applied via setPaintProperty */
			circleColor = ref('#3bb2d0'),
			circleRadius = ref(8),
			genericDemoData = ref<FeatureCollection>({
				type: 'FeatureCollection',
				features: [
					{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [13.4, 52.52] } },
					{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [13.35, 52.51] } }
				]
			}),
			showCustomControl = ref(true),
			useDrawPlugin = ref(false),
			loaded = ref(0),
			markerCoordinates = ref<LngLatLike>([13.377507, 52.516267]),
			bounds = ref<LngLatBoundsLike>(),
			drawMode = ref<DrawMode>(DrawMode.CIRCLE_STATIC),
			drawModel = ref<DrawModel>(),
			geojsonSource = {
				data: ref<FeatureCollection<LineString>>({
					type: 'FeatureCollection',
					features: [
						{
							type: 'Feature',
							properties: {},
							geometry: {
								type: 'LineString',
								coordinates: [
									[-122.483696, 37.833818],
									[-122.483482, 37.833174]
								]
							}
						}
					]
				}),
				show: ref(true)
			};

		watch(
			() => map.isLoaded,
			() => console.log('IS LOADED', map),
			{ immediate: true }
		);
		watch(
			() => map.isMounted,
			(v: boolean) => console.log('IS MOUNTED', v),
			{ immediate: true }
		);

		watch(
			drawMode,
			() => {
				switch (drawMode.value) {
					case DrawMode.CIRCLE:
						drawModel.value = drawCircleExample;
						break;
					case DrawMode.CIRCLE_STATIC:
						drawModel.value = drawCircleExample;
						break;
					default:
						drawModel.value = drawPolygonExample;
						break;
				}
			},
			{ immediate: true }
		);

		onMounted(() => {
			setTimeout(() => (markerCoordinates.value = [13.377507, 42.516267]), 5000);
			setInterval(() => {
				if (geojsonSource.data.value.features[0]!.geometry.coordinates.length >= lineString.length) {
					geojsonSource.data.value = {
						type: 'FeatureCollection',
						features: [
							{
								type: 'Feature',
								properties: {},
								geometry: {
									type: 'LineString',
									coordinates: [
										[-122.483696, 37.833818],
										[-122.483482, 37.833174]
									]
								}
							}
						]
					};
				} else {
					geojsonSource.data.value = {
						type: 'FeatureCollection',
						features: [
							{
								type: 'Feature',
								properties: {},
								geometry: {
									type: 'LineString',
									coordinates: [
										...geojsonSource.data.value.features[0]!.geometry.coordinates!,
										lineString[geojsonSource.data.value.features[0]!.geometry.coordinates.length]!
									]
								}
							}
						]
					};
				}
			}, 1000);
		});

		function onLoad(e: MglEvent) {
			console.log('onLoad', e);
			loaded.value++;
			mapVersion.value = e.map.version;
			console.log(e.type, e, e.map.version);
		}

		function onGenericLayerClick(e: MapLayerMouseEvent) {
			console.log('generic layer click', e.lngLat);
		}

		function onMouseenter(e: MapLayerMouseEvent) {
			console.log('EVENT', e.type, e.lngLat);
		}

		function setLanguage(e: Event) {
			console.log('setLanguage', e);
			map.language = (e.target as HTMLSelectElement).value as ValidLanguages;
		}

		// setTimeout(() => drawModel.value = drawCircleExample2, 5000);

		return {
			showCustomControl,
			useDrawPlugin,
			loaded,
			map,
			mapVersion,
			markerCoordinates,
			geojsonSource,
			bounds,
			onLoad,
			onMouseenter,
			setLanguage,
			geojsonSourceData: geojsonSource.data,
			isZooming: ref(false),
			controlPosition: ref(Position.TOP_LEFT),
			showMap: ref(true),
			center: [10.288107, 49.405078] as LngLatLike,
			zoom: 3,
			useClasses: ref(true),
			mapStyles: [
				{
					name: 'Streets',
					label: 'Streets',
					// icon : { path: mdiRoad },
					style: 'https://api.maptiler.com/maps/streets-v4/style.json?key=' + import.meta.env.VITE_MAP_STYLE_KEY
				},
				{
					name: 'Base',
					label: 'Basic',
					style: 'https://api.maptiler.com/maps/base-v4/style.json?key=?key=' + import.meta.env.VITE_MAP_STYLE_KEY
				},
				{
					name: 'Bright',
					label: 'Bright',
					style: 'https://api.maptiler.com/maps/bright-v2/style.json?key=' + import.meta.env.VITE_MAP_STYLE_KEY
				},
				{
					name: 'Satellite',
					label: 'Satellite',
					style: 'https://api.maptiler.com/maps/hybrid-v4/style.json?key=' + import.meta.env.VITE_MAP_STYLE_KEY
				},
				{
					name: 'Toner',
					label: 'Voyager',
					style: 'https://api.maptiler.com/maps/toner-v2/style.json?key=' + import.meta.env.VITE_MAP_STYLE_KEY
				}
			] as StyleSwitchItem[],
			buttonIcon: mdiCursorDefaultClick,
			layout: {
				'line-join': 'round',
				'line-cap': 'round'
			} as LineLayerSpecification['layout'],
			paint: {
				'line-color': '#FF0000',
				'line-width': 8
			} as LineLayerSpecification['paint'],
			librariesSourceTiles: ['https://api.librarydata.uk/libraries/{z}/{x}/{y}.mvt'],
			librariesLayerCirclesPaint: {
				'circle-radius': 5,
				'circle-color': '#1b5e20'
			} as CircleLayerSpecification['paint'],
			librariesLayerCirclesFilter: ['!', ['has', 'point_count']] as CircleLayerSpecification['filter'],
			defaultBoundsOptions: {
				animate: true,
				maxZoom: 16,
				duration: 300,
				padding: 50,
				useOnBoundsUpdate: true
			} as FitBoundsOptions,
			drawMode,
			drawModel,
			/* the emit is typed `DrawModel | undefined`: clearing the drawing reports no model */
			onDrawModelUpdate(m: DrawModel | undefined) {
				console.log('drawModelUpdate', m);
			},
			circleColor,
			circleRadius,
			genericDemoData,
			onGenericLayerClick
		};
	}
});
</script>

<style>
body {
	margin: 0;
	font-family: Roboto, 'Helvetica Neue', sans-serif;
	font-size: 14px;
}

.map-container {
	height: 400px;
	width: 800px;
	max-width: 100%;
	resize: both;
	overflow: auto;
	border: 1px solid #d6d6d6;
	margin-bottom: 20px;
}
</style>
