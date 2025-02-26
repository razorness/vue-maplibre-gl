import { throttle } from '@/lib/debounce.ts';
import { AbstractDrawMode } from '@/plugins/draw/mode.abstract.ts';
import type { DrawPlugin } from '@/plugins/draw/plugin.ts';
import type { DrawFeatureProperties, DrawModel, DrawModeSnapshot } from '@/plugins/draw/types.ts';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import distance from '@turf/distance';
import type { Feature, Polygon, Position } from 'geojson';
import type { GeoJSONSource, Map, MapLayerMouseEvent, MapLayerTouchEvent } from 'maplibre-gl';

export class CircleMode extends AbstractDrawMode {

	private _mode: 'move' | 'resize' | undefined;
	private _moveStart: DrawModeSnapshot | undefined;
	private _resizeAnker: number | undefined;

	constructor(plugin: DrawPlugin, map: Map, source: GeoJSONSource, model: DrawModel | undefined) {
		super(plugin, map, source);
		this.onClick     = this.onClick.bind(this);
		this.onMouseMove = throttle(this.onMouseMove.bind(this), 16);
		this.onMouseDown = this.onMouseDown.bind(this);
		this.onMouseUp   = this.onMouseUp.bind(this);
		this.setModel(model);
	}

	onClick(e: MapLayerMouseEvent | MapLayerTouchEvent) {

		if (this._mode) {
			return;
		}

		if (this.hasPolygon()) {
			const polygon = this.getPolygon();
			if (booleanPointInPolygon(e.lngLat.toArray(), polygon)) {
				e.preventDefault();
				return;
			}
		}


		const pos    = e.lngLat.toArray(),
			  pixel  = this.map.unproject([ e.point.x + this.plugin.options.circleMode.creationSize, e.point.y ]),
			  radius = distance(pos, pixel.toArray(), { units: 'meters' }),
			  c      = this.createCircle(pos, radius);

		this.createFeatureCollection(c);

		this.generateVertices();
		this.render();
		this.emitOnUpdate();

	}

	onMouseDown(e: MapLayerMouseEvent | MapLayerTouchEvent) {

		if (!this.collection?.features.length) {
			return;
		}

		if ((e as MapLayerTouchEvent).points?.length > 1) {
			// multi touch event
			return;
		}

		for (let i = 0, len = this.collection.features[ 1 ].geometry.coordinates.length; i < len; i++) {
			if (this.isNearby(this.collection.features[ 1 ].geometry.coordinates[ i ] as Position, e.point, this.isTouchEvent(e))) {
				e.preventDefault();
				this._resizeAnker = i;
				this._mode        = 'resize';
				return;
			}
		}

		const polygon = this.getPolygon();
		if (booleanPointInPolygon(e.lngLat.toArray(), polygon)) {
			e.preventDefault();
			this._moveStart = { polygon: this.clonePolygon(), point: [ ...polygon.properties.center! ], start: e.lngLat };
			this._mode      = 'move';
		}

	}

	onMouseMove(e: MapLayerMouseEvent | MapLayerTouchEvent) {

		if (!this._mode || !this.collection?.features.length) {
			return;
		}

		let polygon: Feature<Polygon, DrawFeatureProperties>;
		switch (this._mode) {
			case 'move':

				if (!this._moveStart) {
					return;
				}

				e.preventDefault();

				polygon = this.getPolygon();

				const latd = e.lngLat.lat - this._moveStart.start.lat,
					  lngd = e.lngLat.lng - this._moveStart.start.lng;
				for (let i = 0, len = polygon.geometry.coordinates[ 0 ].length; i < len; i++) {
					polygon.geometry.coordinates[ 0 ][ i ][ 1 ] = this._moveStart.polygon[ i ][ 1 ] + latd;
					polygon.geometry.coordinates[ 0 ][ i ][ 0 ] = this._moveStart.polygon[ i ][ 0 ] + lngd;
				}
				polygon.properties.center![ 1 ] = this._moveStart.point![ 1 ] + latd;
				polygon.properties.center![ 0 ] = this._moveStart.point![ 0 ] + lngd;

				this.generateVertices();
				this.render();
				break;

			case 'resize':

				if (!this._resizeAnker) {
					return;
				}

				e.preventDefault();

				polygon                           = this.getPolygon();
				const radius                      = distance(polygon.properties.center!, e.lngLat.toArray(), { units: 'meters' });
				polygon.geometry.coordinates[ 0 ] = this.createCircle(polygon.properties.center!, radius!).geometry.coordinates[ 0 ];
				polygon.properties.radius         = radius!;

				this.generateVertices();
				this.render();
				break;

		}

	}

	onMouseUp(e: MapLayerMouseEvent | MapLayerTouchEvent) {

		if (!this._mode) {
			return;
		}

		switch (this._mode) {
			case 'move':
			case 'resize':
				e.preventDefault();
				this._mode        = undefined;
				this._moveStart   = undefined;
				this._resizeAnker = undefined;
				this.emitOnUpdate();
				break;
		}

	}

	private generateVertices() {

		if (!this.collection) {
			return;
		}

		const polygon  = this.getPolygon(),
			  vertices = this.createCircle(polygon.properties.center!, polygon.properties.radius!, 4);

		this.collection.features[ 1 ].geometry.coordinates = vertices.geometry.coordinates[ 0 ].slice(0, -1);

	}

	private createFeatureCollection(model: DrawModel) {
		this.collection = {
			type: 'FeatureCollection', features: [
				model,
				{
					type      : 'Feature',
					geometry  : {
						type       : 'MultiPoint',
						coordinates: []
					},
					properties: { meta: 'vertex' }
				}
			]
		};
	}

	register(): void {
		this.map.on('click', this.onClick);
		this.map.on('mousemove', this.onMouseMove);
		this.map.on('mousedown', this.onMouseDown);
		this.map.on('mouseup', this.onMouseUp);
		this.map.on('touchstart', this.onMouseDown);
		this.map.on('touchmove', this.onMouseMove);
		this.map.on('touchend', this.onMouseUp);
	}

	unregister(): void {
		this.map.off('click', this.onClick);
		this.map.off('mousemove', this.onMouseMove);
		this.map.off('mousedown', this.onMouseDown);
		this.map.off('mouseup', this.onMouseUp);
		this.map.off('touchstart', this.onMouseDown);
		this.map.off('touchmove', this.onMouseMove);
		this.map.off('touchend', this.onMouseUp);
	}

	setModel(model: DrawModel | undefined) {
		if (model?.properties?.meta === 'circle') {
			this.createFeatureCollection(model);
			this.generateVertices();
		} else {
			this.collection = undefined;
		}
		this.render();
	}

	onOptionsUpdate() {
		if (this.collection?.features[ 0 ]) {
			this.collection.features[ 0 ].properties.minSizeLabel = this.plugin.options.minArea.label;
		}
	}

}
