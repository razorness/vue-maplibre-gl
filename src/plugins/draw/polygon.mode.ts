import { throttle } from '@/lib/debounce.ts';
import { AbstractDrawMode } from '@/plugins/draw/mode.abstract.ts';
import type { DrawPlugin } from '@/plugins/draw/plugin.ts';
import type { DrawFeatureProperties, DrawModel, DrawModeSnapshot } from '@/plugins/draw/types.ts';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import simplify from '@turf/simplify';
import { type Feature, type Polygon, type Position } from 'geojson';
import { type GeoJSONSource, type Map, type MapLayerMouseEvent, type MapLayerTouchEvent } from 'maplibre-gl';

export class PolygonMode extends AbstractDrawMode {

	private _mode: 'create' | 'move' | 'add_vertex' | 'move_vertex' | undefined;
	private _moveStart: DrawModeSnapshot | undefined;

	constructor(plugin: DrawPlugin, map: Map, source: GeoJSONSource, model: DrawModel | undefined) {
		super(plugin, map, source);
		this.onClick       = this.onClick.bind(this);
		this.onDoubleClick = this.onDoubleClick.bind(this);
		this.onMouseMove   = throttle(this.onMouseMove.bind(this), 16);
		this.onMouseDown   = this.onMouseDown.bind(this);
		this.onMouseUp     = this.onMouseUp.bind(this);
		this.setModel(model);
	}

	private onClick(e: MapLayerMouseEvent | MapLayerTouchEvent) {

		const pos: Position = e.lngLat.toArray();
		let polygon: Feature<Polygon, DrawFeatureProperties> | undefined;
		switch (this._mode) {
			case 'create':

				polygon = this.getPolygon();

				// check if it's a closing click
				if (this.isNearby(polygon.geometry.coordinates[ 0 ][ 0 ] as Position, e.point, this.isTouchEvent(e))) {
					const polygon = this.getPolygon();
					polygon.geometry.coordinates[ 0 ].splice(1, 1); // remove last created by mousedown
					this.endCreation();
					return;
				}


				polygon.geometry.coordinates[ 0 ].splice(1, 0, pos);
				this.collection!.features[ 1 ].geometry.coordinates[ 1 ] = pos;

				const len          = polygon.geometry.coordinates[ 0 ].length,
					  helperVertex = len - 2;

				if (polygon.properties.hasHelperVertex && len === 5) {
					polygon.geometry.coordinates[ 0 ].splice(helperVertex, 1);
					polygon.properties.hasHelperVertex = false;
				}
				break;

			default:

				// control click removes vertex
				if (e.originalEvent.ctrlKey && this.collection) {

					e.preventDefault();

					const polygon = this.getPolygon(),
						  len     = polygon.geometry.coordinates[ 0 ].length;

					if (len < 5) {
						// we dont remove vertices on triangles
						return;
					}

					for (let i = 0; i < len; i++) {
						if (this.isNearby(polygon.geometry.coordinates[ 0 ][ i ], e.point, this.isTouchEvent(e))) {
							polygon.geometry.coordinates[ 0 ].splice(i, 1);
							if (i === 0) {
								polygon.geometry.coordinates[ 0 ].splice(-1, 1);
								polygon.geometry.coordinates[ 0 ].push(polygon.geometry.coordinates[ 0 ][ 0 ]);
							}
							this.generateCollectionWithVertexes();
							this.source?.setData(this.collection);
							this.emitOnUpdate();
							return;
						}
					}

				}

				if (this.hasPolygon()) {
					polygon = this.getPolygon();
					if (booleanPointInPolygon(e.lngLat.toArray(), polygon)) {
						e.preventDefault();
						return;
					}
				}


				this.createFeatureCollection({
					type      : 'Feature',
					geometry  : {
						type       : 'Polygon',
						coordinates: [ [ pos, pos, pos, pos ] ]
					},
					properties: { meta: 'polygon', hasHelperVertex: true }
				});
				this.collection!.features[ 1 ].geometry.coordinates = [ pos, pos ];

				this._mode = 'create';

		}

		this.render();

	}

	private onDoubleClick(e: MapLayerMouseEvent) {

		if (!this._mode || !this.collection) {
			return;
		}

		switch (this._mode) {
			case 'create':

				e.preventDefault();

				this.endCreation();
				break;

		}

	}

	private onMouseMove(e: MapLayerMouseEvent | MapLayerTouchEvent) {

		if (!this._mode || !this.collection?.features.length) {
			return;
		}

		let polygon: Feature<Polygon>, pos: Position;
		switch (this._mode) {
			case 'create':

				e.preventDefault();
				polygon = this.getPolygon();
				pos     = e.lngLat.toArray();

				const len                              = polygon.geometry.coordinates[ 0 ].length,
					  helperVertex                     = len - 2;
				polygon.geometry.coordinates[ 0 ][ 1 ] = pos;
				if (polygon.properties!.hasHelperVertex) {
					const npos                                        = this.map.unproject([ e.point.x + 1, e.point.y ]),
						  dist                                        = Math.abs((npos.lng - pos[ 0 ]) / 3);
					polygon.geometry.coordinates[ 0 ][ helperVertex ] = this.calculateB(pos, polygon.geometry.coordinates[ 0 ][ 0 ], dist);
				}
				this.render();
				break;

			case 'move':

				if (!this._moveStart) {
					return;
				}

				e.preventDefault();

				polygon = this.getPolygon();

				const lngd = e.lngLat.lng - this._moveStart.start.lng,
					  latd = e.lngLat.lat - this._moveStart.start.lat;
				for (let i = 0, len = polygon.geometry.coordinates[ 0 ].length; i < len; i++) {
					polygon.geometry.coordinates[ 0 ][ i ][ 0 ] = this._moveStart.polygon[ i ][ 0 ] + lngd;
					polygon.geometry.coordinates[ 0 ][ i ][ 1 ] = this._moveStart.polygon[ i ][ 1 ] + latd;
				}
				this.generateCollectionWithVertexes();
				this.render();
				break;

			case 'move_vertex':

				if (!this._moveStart) {
					return;
				}

				e.preventDefault();

				polygon = this.getPolygon();
				pos     = e.lngLat.toArray();

				for (let i = 0, len = polygon.geometry.coordinates[ 0 ].length; i < len; i++) {
					if (this._moveStart.polygon[ i ][ 0 ] === this._moveStart.point![ 0 ] && this._moveStart.polygon[ i ][ 1 ] === this._moveStart.point![ 1 ]) {
						polygon.geometry.coordinates[ 0 ][ i ] = pos;
						if (i === 0) {
							polygon.geometry.coordinates[ 0 ][ polygon.geometry.coordinates[ 0 ].length - 1 ] = pos;
						}
						break;
					}
				}

				this.generateCollectionWithVertexes();
				this.render();
				break;

			case 'add_vertex':

				if (!this._moveStart) {
					return;
				}

				e.preventDefault();

				polygon = this.getPolygon();
				pos     = e.lngLat.toArray();

				for (let i = 0, len = polygon.geometry.coordinates[ 0 ].length; i < len - 1; i++) {
					const midpoint = this.getMidpoint(polygon.geometry.coordinates[ 0 ][ i ], polygon.geometry.coordinates[ 0 ][ i + 1 ]);
					if (midpoint[ 0 ] === this._moveStart.point![ 0 ] && midpoint[ 1 ] === this._moveStart.point![ 1 ]) {

						polygon.geometry.coordinates[ 0 ].splice(i + 1, 0, midpoint);

						this._moveStart = {
							polygon: this.clonePolygon(),
							point  : midpoint,
							start  : e.lngLat
						};
						this._mode      = 'move_vertex';
						break;
					}

				}

				this.generateCollectionWithVertexes();
				this.render();
				break;

		}


	}

	onMouseDown(e: MapLayerMouseEvent | MapLayerTouchEvent) {

		if (this._mode === 'create' || !this.collection?.features.length) {
			return;
		}

		if ((e as MapLayerTouchEvent).points?.length > 1) {
			// multi touch event
			return;
		}

		for (let i = 0, len = this.collection.features[ 1 ].geometry.coordinates.length; i < len; i++) {
			if (this.isNearby(this.collection.features[ 1 ].geometry.coordinates[ i ] as Position, e.point, this.isTouchEvent(e))) {
				e.preventDefault();
				this._moveStart = {
					polygon: this.clonePolygon(),
					point  : this.collection.features[ 1 ].geometry.coordinates[ i ] as Position,
					start  : e.lngLat
				};
				this._mode      = 'move_vertex';
				return;
			}
		}

		for (let i = 0, len = this.collection.features[ 2 ].geometry.coordinates.length; i < len; i++) {
			if (this.isNearby(this.collection.features[ 2 ].geometry.coordinates[ i ] as Position, e.point, this.isTouchEvent(e))) {
				e.preventDefault();
				this._moveStart = {
					polygon: this.clonePolygon(),
					point  : this.collection.features[ 2 ].geometry.coordinates[ i ] as Position,
					start  : e.lngLat
				};
				this._mode      = 'add_vertex';
				return;
			}
		}

		const polygon = this.getPolygon();
		if (booleanPointInPolygon(e.lngLat.toArray(), polygon)) {
			e.preventDefault();
			this._moveStart = { polygon: this.clonePolygon(), start: e.lngLat };
			this._mode      = 'move';
		}


	}

	onMouseUp(e: MapLayerMouseEvent | MapLayerTouchEvent) {

		if (!this._mode) {
			return;
		}

		switch (this._mode) {
			case 'move':
			case 'move_vertex':
			case 'add_vertex':
				e.preventDefault();
				this._mode      = undefined;
				this._moveStart = undefined;

				// don't emit on ctrl click, this will be handled separately in onClick
				if (!e.originalEvent.ctrlKey) {
					this.emitOnUpdate();
				}

				break;
		}

	}

	register(): void {
		this.map.on('click', this.onClick);
		this.map.on('dblclick', this.onDoubleClick);
		this.map.on('mousemove', this.onMouseMove);
		this.map.on('mousedown', this.onMouseDown);
		this.map.on('mouseup', this.onMouseUp);
		this.map.on('touchstart', this.onMouseDown);
		this.map.on('touchmove', this.onMouseMove);
		this.map.on('touchend', this.onMouseUp);
	}

	unregister(): void {
		this.map.off('click', this.onClick);
		this.map.off('dblclick', this.onDoubleClick);
		this.map.off('mousemove', this.onMouseMove);
		this.map.off('mousedown', this.onMouseDown);
		this.map.off('mouseup', this.onMouseUp);
		this.map.off('touchstart', this.onMouseDown);
		this.map.off('touchmove', this.onMouseMove);
		this.map.off('touchend', this.onMouseUp);
	}

	setModel(model: DrawModel | undefined): void {
		if (model?.properties?.meta === 'polygon') {
			this.createFeatureCollection(model);
			this.generateCollectionWithVertexes();
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
				},
				{
					type      : 'Feature',
					geometry  : {
						type       : 'MultiPoint',
						coordinates: []
					},
					properties: { meta: 'midpoint' }
				}
			]
		};
	}

	private endCreation() {

		const polygon                  = this.getPolygon();
		this._mode                     = undefined;
		this.collection!.features[ 0 ] = simplify(polygon, { tolerance: 0.00001, highQuality: true });

		this.generateCollectionWithVertexes();
		this.render();
		this.emitOnUpdate();

	}

	private generateCollectionWithVertexes() {

		if (!this.collection) {
			return;
		}

		const polygon = this.getPolygon(),
			  len     = polygon.geometry.coordinates[ 0 ].length;

		this.collection.features[ 1 ].geometry.coordinates = polygon.geometry.coordinates[ 0 ].slice(0, -1);

		const midpoints: Position[] = new Array(len - 1);
		for (let i = 0; i < len - 1; i++) {
			midpoints[ i ] = this.getMidpoint(polygon.geometry.coordinates[ 0 ][ i ], polygon.geometry.coordinates[ 0 ][ i + 1 ]);
		}
		this.collection.features[ 2 ].geometry.coordinates = midpoints;

	}

	private calculateB(a: Position, c: Position, dist: number): Position {
		const dx       = a[ 0 ] - c[ 0 ];
		const dy       = a[ 1 ] - c[ 1 ];
		const lengthAC = Math.sqrt(dx * dx + dy * dy);

		const xB = c[ 0 ] + dist * (-dy / lengthAC);
		const yB = c[ 1 ] + dist * (dx / lengthAC);

		return [ xB, yB ];
	}

}
