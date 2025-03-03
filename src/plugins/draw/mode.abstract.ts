import type { DrawPlugin } from '@/plugins/draw/plugin.ts';
import type { DrawFeatureProperties, DrawModel } from '@/plugins/draw/types.ts';
import area from '@turf/area';
import circle from '@turf/circle';
import type { Feature, FeatureCollection, MultiPoint, Polygon, Position } from 'geojson';
import type { GeoJSONSource, LngLatLike, Map, MapLayerMouseEvent, MapLayerTouchEvent } from 'maplibre-gl';

export abstract class AbstractDrawMode {

	isTouchEventSupported: boolean = window !== undefined && !!window.TouchEvent;
	plugin: DrawPlugin;
	map: Map;
	source: GeoJSONSource;

	collection: FeatureCollection<Polygon | MultiPoint, DrawFeatureProperties> | undefined;

	protected constructor(plugin: DrawPlugin, map: Map, source: GeoJSONSource) {
		this.plugin = plugin;
		this.map    = map;
		this.source = source;
	}

	hasPolygon() {
		return !!this.collection?.features[ 0 ];
	}

	getPolygon(): Feature<Polygon, DrawFeatureProperties> {
		return this.collection!.features[ 0 ] as Feature<Polygon, DrawFeatureProperties>;
	}

	clonePolygon(): Position[] {
		return this.getPolygon().geometry.coordinates[ 0 ].map((p) => [ p[ 0 ], p[ 1 ] ]) as Position[];
	}

	isNearby(a: Position, b: { x: number, y: number }, isTouch: boolean): boolean {
		const tolerance = isTouch ? this.plugin.options.pointerPrecision.touch : this.plugin.options.pointerPrecision.mouse,
			  point     = this.map.project(a as LngLatLike),
			  distance  = Math.sqrt((b.x - point.x) ** 2 + (b.y - point.y) ** 2);
		return distance <= tolerance;
	}

	getMidpoint(a: Position, b: Position): Position {
		return [ (a[ 0 ] + b[ 0 ]) / 2, (a[ 1 ] + b[ 1 ]) / 2 ];
	}

	clear() {
		this.source?.setData({ type: 'FeatureCollection', features: [] });
	}

	render() {
		if (!this.source) {
			return;
		}

		if (this.plugin.options.minArea.size && this.collection?.features[ 0 ]) {
			const areaSize                                         = this.getAreaSize(this.collection!.features[ 0 ] as Feature<Polygon, DrawFeatureProperties>);
			this.collection!.features[ 0 ].properties.area         = areaSize;
			this.collection!.features[ 0 ].properties.tooSmall     = areaSize < this.plugin.options.minArea.size && !this.collection!.features[ 0 ].properties.hasHelperVertex;
			this.collection!.features[ 0 ].properties.minSizeLabel = this.plugin.options.minArea.label;
		}
		this.source.setData(this.collection ?? { type: 'FeatureCollection', features: [] });
	}

	emitOnUpdate(feature?: Feature<Polygon, DrawFeatureProperties>) {
		if (feature) {
			this.plugin.options.onUpdate?.(feature);
		} else if (this.collection) {
			this.plugin.options.onUpdate?.(this.collection!.features[ 0 ] as Feature<Polygon, DrawFeatureProperties>);
		}
	}

	createCircle(center: Position, radius: number, steps = 64): Feature<Polygon, DrawFeatureProperties> {
		const c               = circle<DrawFeatureProperties>(center, radius,
			{
				units     : 'meters', steps,
				properties: { center, radius, meta: 'circle', minSizeLabel: this.plugin.options.minArea.label }
			});
		c.properties.area     = this.getAreaSize(c);
		c.properties.tooSmall = c.properties.area < (this.plugin.options.minArea.size ?? -1);
		return c;
	}

	// returns m²
	getAreaSize(model: Feature<Polygon, DrawFeatureProperties>): number {
		if (model.properties.meta === 'circle' && model.properties.radius) {
			return Math.PI * Math.pow(model.properties.radius, 2);
		}
		return area(model);
	}

	isTouchEvent(e: MapLayerMouseEvent | MapLayerTouchEvent): boolean {
		if (this.isTouchEventSupported) {
			return e.originalEvent instanceof TouchEvent;
		}
		return false;
	}

	abstract register(): void;

	abstract unregister(): void;

	abstract setModel(model: DrawModel | undefined): void;

	abstract onOptionsUpdate(): void;

}
