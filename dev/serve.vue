<template>
	<div>
		<mgl-map
			ref="map"
			height="400px" width="800px"
			style="margin-bottom: 20px"
			:center="center"
			:zoom="zoom"
			:attribution-control="false"
			@map:load="onLoad"
			@map:zoomstart="isZooming = true"
			@map:zoomend="isZooming = false"
		>
			<mgl-fullscreen-control/>
			<mgl-attribution-control/>
			<mgl-navigation-control/>
			<mgl-scale-control/>
			<mgl-geolocation-control/>
			<mgl-custom-control position="top-left" :no-classes="!useClasses">
				<mgl-button type="mdi" :path="buttonIcon" style="color: deepskyblue"/>
			</mgl-custom-control>
			<mgl-style-switch-control :map-styles="mapStyles" :position="controlPosition"/>

			<mgl-marker :coordinates="markerCoordinates" color="#cc0000" :scale="0.5"/>

			<mgl-geo-json-source source-id="geojson" :data="geoJsonSource.data">
				<mgl-line-layer v-if="geoJsonSource.show" layer-id="geojson" :layout="geoJsonSource.layout" :paint="geoJsonSource.paint"/>
			</mgl-geo-json-source>

		</mgl-map>
		Loaded Count: {{ loaded }}<br>
		Is Zooming: {{ isZooming }}<br>
		<div>
			<input type="radio" id="one" value="top-left" v-model="controlPosition"/>
			<label for="one">top-left</label>
			<br/>
			<input type="radio" id="tw0" value="top-right" v-model="controlPosition"/>
			<label for="tw0">top-right</label>
			<br/>
			<input type="radio" id="three" value="bottom-left" v-model="controlPosition"/>
			<label for="three">bottom-left</label>
			<br/>
			<input type="radio" id="four" value="bottom-right" v-model="controlPosition"/>
			<label for="four">bottom-right</label>
			<br/>
			<span>Attribution Position: {{ controlPosition }}</span>
		</div>
		<div>
			<input type="checkbox" v-model="useClasses" id="noclasses">
			<label for="noclasses">Use Custom Control Classes</label>
		</div>
	</div>
</template>

<script lang="ts">
	import { defineComponent, toRef, watch } from 'vue';
	import { MglDefaults, MglEvent, StyleSwitchItem, useMap } from '@/entry.esm';
	import { mdiCursorDefaultClick } from '@mdi/js';
	import { LineLayout, LinePaint } from 'maplibre-gl';

	MglDefaults.style = 'https://api.maptiler.com/maps/streets/style.json?key=cQX2iET1gmOW38bedbUh';
	console.log('MglDefaults', MglDefaults);

	export default defineComponent({
		name: 'ServeDev',
		setup() {

			const map = useMap();

			watch(toRef(map, 'isLoaded'), () => (console.log('IS LOADED', map)), { immediate: true });
			watch(toRef(map, 'isMounted'), v => (console.log('IS MOUNTED', v)), { immediate: true });

			return {
				loaded           : 0,
				isZooming        : false,
				controlPosition  : 'top-left',
				center           : [ 10.288107, 49.405078 ],
				zoom             : 3,
				useClasses       : true,
				mapStyles        : [
					{
						name : 'Streets',
						label: 'Streets',
						// icon : { path: mdiRoad },
						style: 'https://api.maptiler.com/maps/streets/style.json?key=cQX2iET1gmOW38bedbUh'
					},
					{ name: 'Basic', label: 'Basic', style: 'https://api.maptiler.com/maps/basic/style.json?key=cQX2iET1gmOW38bedbUh' },
					{ name: 'Bright', label: 'Bright', style: 'https://api.maptiler.com/maps/bright/style.json?key=cQX2iET1gmOW38bedbUh' },
					{ name: 'Satellite', label: 'Satellite', style: 'https://api.maptiler.com/maps/hybrid/style.json?key=cQX2iET1gmOW38bedbUh' },
					{ name: 'Voyager', label: 'Voyager', style: 'https://api.maptiler.com/maps/voyager/style.json?key=cQX2iET1gmOW38bedbUh' }
				] as StyleSwitchItem[],
				buttonIcon       : mdiCursorDefaultClick,
				markerCoordinates: [ 13.377507, 52.516267 ],
				geoJsonSource    : {
					show  : true,
					data  : {
						type      : 'Feature',
						properties: {},
						geometry  : {
							type       : 'LineString',
							coordinates: [
								[ -122.483696, 37.833818 ],
								[ -122.483482, 37.833174 ],
								[ -122.483396, 37.8327 ],
								[ -122.483568, 37.832056 ],
								[ -122.48404, 37.831141 ],
								[ -122.48404, 37.830497 ],
								[ -122.483482, 37.82992 ],
								[ -122.483568, 37.829548 ],
								[ -122.48507, 37.829446 ],
								[ -122.4861, 37.828802 ],
								[ -122.486958, 37.82931 ],
								[ -122.487001, 37.830802 ],
								[ -122.487516, 37.831683 ],
								[ -122.488031, 37.832158 ],
								[ -122.488889, 37.832971 ],
								[ -122.489876, 37.832632 ],
								[ -122.490434, 37.832937 ],
								[ -122.49125, 37.832429 ],
								[ -122.491636, 37.832564 ],
								[ -122.492237, 37.833378 ],
								[ -122.493782, 37.833683 ]
							]
						}
					},
					layout: {
						'line-join': 'round',
						'line-cap' : 'round'
					} as LineLayout,
					paint : {
						'line-color': '#FF0000',
						'line-width': 8
					} as LinePaint
				}
			};
		},
		methods: {
			onLoad(e: MglEvent) {
				this.loaded++;
				console.log(e.type, e);
			}
		},
		mounted() {
			setTimeout(() => (this.markerCoordinates = [ 13.377507, 42.516267 ]), 5000);
			// setInterval(() => (this.geoJsonSource.show = !this.geoJsonSource.show), 1000);
		}
	});
</script>

<style lang="scss">
	@import "~@/css/maplibre";

	body {
		margin: 0;
	}
</style>
