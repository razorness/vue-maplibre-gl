import type { DrawPlugin } from '@/plugins/draw/plugin.ts';
import type { DrawFeatureProperties, DrawModel } from '@/plugins/draw/types.ts';
import circle from '@turf/circle';
import type { Feature, FeatureCollection, MultiPoint, Polygon, Position } from 'geojson';
import type { GeoJSONSource, LngLatLike, Map } from 'maplibre-gl';

export abstract class AbstractDrawMode {

	plugin: DrawPlugin;
	map: Map;
	source: GeoJSONSource;

	collection: FeatureCollection<Polygon | MultiPoint, DrawFeatureProperties> | undefined;

	protected constructor(plugin: DrawPlugin, map: Map, source: GeoJSONSource) {
		this.plugin = plugin;
		this.map    = map;
		this.source = source;
	}

	getPolygon(): Feature<Polygon, DrawFeatureProperties> {
		return this.collection!.features[ 0 ] as Feature<Polygon, DrawFeatureProperties>;
	}

	clonePolygon(): Position[] {
		return this.getPolygon().geometry.coordinates[ 0 ].map((p) => [ p[ 0 ], p[ 1 ] ]) as Position[];
	}

	isNearby(a: Position, b: { x: number, y: number }, tolerance: number = 25): boolean {
		const point = this.map.project(a as LngLatLike);
		return Math.abs(b.x - point.x) < 25 && Math.abs(b.y - point.y) <= tolerance;
	}

	getMidpoint(a: Position, b: Position): Position {
		return [ (a[ 0 ] + b[ 0 ]) / 2, (a[ 1 ] + b[ 1 ]) / 2 ];
	}

	clear() {
		this.source.setData({ type: 'FeatureCollection', features: [] });
	}

	render() {
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
		return circle<DrawFeatureProperties>(center, radius, { units: 'degrees', steps, properties: { center, radius, meta: 'circle' } });
	}

	abstract register(): void;

	abstract unregister(): void;

	abstract setModel(model: DrawModel | undefined): void;

}
