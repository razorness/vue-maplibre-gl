import { area } from '@turf/area';
import { circle } from '@turf/circle';
import type { Feature, FeatureCollection, MultiPoint, Polygon, Position } from 'geojson';
import type { GeoJSONSource, LngLatLike, Map, MapLayerMouseEvent, MapLayerTouchEvent } from 'maplibre-gl';
import type { DrawPlugin } from 'plugins/draw/plugin';
import type { DrawFeatureProperties, DrawModel } from 'plugins/draw/types';

export abstract class AbstractDrawMode {

	/**
	 * Whether the browser reports touch events.
	 *
	 * A lazy getter, not a class field: as a field the expression ran at *construction* time, and
	 * `window !== undefined` throws a `ReferenceError` under SSR rather than evaluating to `false`
	 * (`typeof window` is what is safe there). Any import of this module server-side blew up.
	 */
	get isTouchEventSupported(): boolean {
		return typeof window !== 'undefined' && Boolean(window.TouchEvent);
	}

	plugin: DrawPlugin;
	map: Map;
	source: GeoJSONSource;

	collection: FeatureCollection<Polygon | MultiPoint, DrawFeatureProperties> | undefined;

	protected constructor(plugin: DrawPlugin, map: Map, source: GeoJSONSource) {
		this.plugin = plugin;
		this.map = map;
		this.source = source;
	}

	hasPolygon() {
		return !!this.collection?.features[0];
	}

	getPolygon(): Feature<Polygon, DrawFeatureProperties> {
		return this.collection!.features[0] as Feature<Polygon, DrawFeatureProperties>;
	}

	/**
	 * The polygon's outer ring.
	 *
	 * Every mode works on a single-ring polygon and `getPolygon()` only ever returns one that has its
	 * ring, so `coordinates[0]` is present by construction. Asserting it once here is what keeps
	 * `noUncheckedIndexedAccess` from flagging the ~40 sites that would otherwise index it directly.
	 */
	get ring(): Position[] {
		return this.getPolygon().geometry.coordinates[0]!;
	}

	/** The vertex feature — `features[1]` of the positional collection. */
	get vertices(): Feature<MultiPoint, DrawFeatureProperties> {
		return this.collection!.features[1] as Feature<MultiPoint, DrawFeatureProperties>;
	}

	/** The midpoint feature — `features[2]` of the positional collection. */
	get midpoints(): Feature<MultiPoint, DrawFeatureProperties> {
		return this.collection!.features[2] as Feature<MultiPoint, DrawFeatureProperties>;
	}

	clonePolygon(): Position[] {
		return this.ring.map(p => [p[0]!, p[1]!]);
	}

	isNearby(a: Position, b: { x: number; y: number }, isTouch: boolean): boolean {
		const tolerance = isTouch ? this.plugin.options.pointerPrecision.touch : this.plugin.options.pointerPrecision.mouse,
			point = this.map.project(a as LngLatLike),
			distance = Math.sqrt((b.x - point.x) ** 2 + (b.y - point.y) ** 2);
		return distance <= tolerance;
	}

	getMidpoint(a: Position, b: Position): Position {
		return [(a[0]! + b[0]!) / 2, (a[1]! + b[1]!) / 2];
	}

	clear() {
		// see the note on render(): setData is async as of maplibre v6
		void this.source?.setData({ type: 'FeatureCollection', features: [] });
	}

	render() {

		if (!this.source) {
			return;
		}

		if (this.plugin.options.minArea.size && this.collection?.features[0]) {
			const areaSize = this.getAreaSize(this.collection.features[0] as Feature<Polygon, DrawFeatureProperties>);
			this.collection.features[0].properties.area = areaSize;
			this.collection.features[0].properties.tooSmall =
				areaSize < this.plugin.options.minArea.size && !this.collection.features[0].properties.hasHelperVertex;
			this.collection.features[0].properties.minSizeLabel = this.plugin.options.minArea.label;
		}
		/*
		 * v6 made GeoJSONSource.setData() async (it returned `this` in v5). Draw rendering is
		 * fire-and-forget by design — every mouse move triggers one — so the promise is dropped
		 * explicitly rather than accidentally.
		 */
		void this.source.setData(this.collection ?? { type: 'FeatureCollection', features: [] });

	}

	emitOnUpdate(feature?: Feature<Polygon, DrawFeatureProperties>) {

		if (feature) {
			this.plugin.options.onUpdate?.(feature);
		} else if (this.collection) {
			this.plugin.options.onUpdate?.(this.collection.features[0] as Feature<Polygon, DrawFeatureProperties>);
		}

	}

	createCircle(center: Position, radius: number, steps = 64): Feature<Polygon, DrawFeatureProperties> {

		const c = circle<DrawFeatureProperties>(center, radius, {
			units: 'meters',
			steps,
			properties: { center, radius, meta: 'circle', minSizeLabel: this.plugin.options.minArea.label }
		});
		c.properties.area = this.getAreaSize(c);
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
