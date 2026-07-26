import type { IControl } from 'maplibre-gl';

/**
 * A stand-in for maplibre's `Map`, implementing exactly the surface this library uses.
 *
 * Why a hand-written fake rather than the real thing or `vi.mock` with auto-mocks:
 *
 * - The real `Map` needs WebGL, a canvas, workers and network access. Under jsdom it cannot even be
 *   constructed, and mocking WebGL well enough is more code than this file.
 * - Events fire **synchronously** here. maplibre defers most of them, which would force every assertion
 *   behind `await nextTick()` plus a timer and make the tests both slower and flakier.
 * - It keeps real style state (sources, layers, paint/layout properties), so the interesting assertions —
 *   "was `setPaintProperty` used instead of a recreate", "did the layer get removed before its source",
 *   "did anything leak after N style switches" — can be made against observable state rather than call
 *   spies.
 *
 * Deliberately *not* a full maplibre emulation: it validates order and identity, not rendering.
 */

type Listener = (ev: unknown) => void;

export interface FakeLayer {
	id: string;
	type: string;
	source?: string;
	'source-layer'?: string;
	paint: Record<string, unknown>;
	layout: Record<string, unknown>;
	filter?: unknown;
	minzoom?: number;
	maxzoom?: number;
	metadata?: unknown;
}

export interface FakeSource {
	id: string;
	type: string;
	options: Record<string, unknown>;
	/** Recorded so a test can assert `setData` was used rather than a remove + re-add. */
	setDataCalls: unknown[];
	setClusterOptionsCalls: unknown[];
	setTilesCalls: unknown[];
	setUrlCalls: unknown[];
	setCoordinatesCalls: unknown[];
	updateImageCalls: unknown[];
	setData(data: unknown): Promise<void>;
	setClusterOptions(options: unknown): Promise<void>;
	setTiles(tiles: string[]): FakeSource;
	setUrl(url: string): FakeSource;
	setCoordinates(coordinates: unknown): FakeSource;
	updateImage(options: unknown): void;
}

export class FakeMap {

	/**
	 * Every instance ever constructed, newest last.
	 *
	 * Tests reach the map through this rather than through `wrapper.vm.map`: what a `<script setup>`
	 * component exposes goes through a proxy that unwraps refs, so the shape depends on Vue internals.
	 * This does not.
	 */
	static instances: FakeMap[] = [];

	static get last(): FakeMap {

		const map = FakeMap.instances.at(-1);
		if (!map) {
			throw new Error('FakeMap: no instance has been constructed yet');
		}
		return map;

	}

	static reset() {
		FakeMap.instances = [];
	}

	constructor(_options?: unknown) {
		FakeMap.instances.push(this);
	}

	/** Ordered, so tests can assert insertion order and `before` handling. */
	readonly layers: FakeLayer[] = [];
	readonly sources = new Map<string, FakeSource>();
	readonly images = new Map<string, unknown>();
	readonly controls: IControl[] = [];
	readonly globalState = new Map<string, unknown>();

	terrain: unknown = null;
	sky: unknown;
	light: unknown;
	projection: unknown;
	transformRequest: unknown;
	style: { name?: string } & Record<string, unknown> = { name: 'fake' };
	removed = false;

	/** Every `on(...)` that was never unsubscribed. A non-empty set after unmount is a leak. */
	readonly listeners = new Map<string, Set<Listener>>();
	/** Layer-scoped listeners, keyed `event:layerId`. */
	readonly layerListeners = new Map<string, Set<Listener>>();

	center = { lng: 0, lat: 0 };
	zoom = 0;
	bearing = 0;
	pitch = 0;
	roll = 0;
	bounds = { _sw: { lng: -1, lat: -1 }, _ne: { lng: 1, lat: 1 } };
	minZoom = 0;
	maxZoom = 24;
	minPitch = 0;
	maxPitch = 85;
	maxBounds: unknown;
	renderWorldCopies = true;

	private isLoaded = false;
	private readonly canvas = { addEventListener: () => {}, removeEventListener: () => {} };
	private readonly canvasContainer = { appendChild: () => {}, removeChild: () => {} };

	/* ---------------------------------------------------------------- events */

	/**
	 * v6 returns a `Subscription`; the library relies on `unsubscribe()` rather than matching the handler
	 * identity in `off()`, so the fake must return one too.
	 */
	on(event: string, layerOrHandler: string | Listener, maybeHandler?: Listener) {

		const isLayerScoped = typeof layerOrHandler === 'string',
			key = isLayerScoped ? `${event}:${layerOrHandler}` : event,
			handler = (isLayerScoped ? maybeHandler : layerOrHandler) as Listener,
			bucket = isLayerScoped ? this.layerListeners : this.listeners;

		if (!bucket.has(key)) {
			bucket.set(key, new Set());
		}
		bucket.get(key)!.add(handler);

		return { unsubscribe: () => bucket.get(key)?.delete(handler) };

	}

	off(event: string, layerOrHandler: string | Listener, maybeHandler?: Listener) {

		const isLayerScoped = typeof layerOrHandler === 'string',
			key = isLayerScoped ? `${event}:${layerOrHandler}` : event,
			handler = (isLayerScoped ? maybeHandler : layerOrHandler) as Listener;
		(isLayerScoped ? this.layerListeners : this.listeners).get(key)?.delete(handler);
		return this;

	}

	once(event: string, handler: Listener) {

		const subscription = this.on(event, (ev: unknown) => {
			subscription.unsubscribe();
			handler(ev);
		});
		return this;

	}

	/** Fires synchronously. `fire` is also part of maplibre's own API and used for `error`. */
	fire(event: string, payload: unknown = {}) {
		for (const handler of [...(this.listeners.get(event) ?? [])]) {
			handler({ type: event, target: this, ...(payload as object) });
		}
		return this;
	}

	fireLayer(event: string, layerId: string, payload: unknown = {}) {
		for (const handler of [...(this.layerListeners.get(`${event}:${layerId}`) ?? [])]) {
			handler({ type: event, target: this, ...(payload as object) });
		}
	}

	/** Test helper: drive the load sequence the way maplibre does (`styledata` before `load`). */
	emitLoad() {
		this.fire('styledata');
		this.isLoaded = true;
		this.fire('load');
	}

	/**
	 * Test helper: what `setStyle({ diff: false })` does — every source and layer is thrown away, then
	 * `style.load` fires. This is the sequence that regressions hide in.
	 */
	emitStyleLoad() {
		this.layers.length = 0;
		this.sources.clear();
		this.images.clear();
		this.fire('style.load');
	}

	loaded() {
		return this.isLoaded;
	}

	/* --------------------------------------------------------------- sources */

	addSource(id: string, options: Record<string, unknown>) {

		if (this.sources.has(id)) {
			throw new Error(`FakeMap: source "${id}" already exists`);
		}
		const source: FakeSource = {
			id,
			type: options.type as string,
			options: { ...options },
			setDataCalls: [],
			setClusterOptionsCalls: [],
			setTilesCalls: [],
			setUrlCalls: [],
			setCoordinatesCalls: [],
			updateImageCalls: [],
			setData: async data => void source.setDataCalls.push(data),
			setClusterOptions: async o => void source.setClusterOptionsCalls.push(o),
			setTiles: t => (source.setTilesCalls.push(t), source),
			setUrl: u => (source.setUrlCalls.push(u), source),
			setCoordinates: c => (source.setCoordinatesCalls.push(c), source),
			updateImage: o => void source.updateImageCalls.push(o)
		};
		this.sources.set(id, source);
		return this;

	}

	getSource(id: string) {
		return this.sources.get(id);
	}

	removeSource(id: string) {

		/* maplibre refuses this while layers still reference the source — the fake enforces it, because
		 * that ordering is exactly what SourceLayerRegistry exists to guarantee. */
		const dependent = this.layers.find(l => l.source === id);
		if (dependent) {
			throw new Error(`FakeMap: cannot remove source "${id}", layer "${dependent.id}" still uses it`);
		}
		this.sources.delete(id);
		return this;

	}

	/* ---------------------------------------------------------------- layers */

	addLayer(layer: Record<string, unknown>, before?: string) {

		if (this.layers.some(l => l.id === layer.id)) {
			throw new Error(`FakeMap: layer "${String(layer.id)}" already exists`);
		}
		const entry: FakeLayer = {
			id: layer.id as string,
			type: layer.type as string,
			source: layer.source as string | undefined,
			'source-layer': layer['source-layer'] as string | undefined,
			paint: { ...((layer.paint as object) ?? {}) },
			layout: { ...((layer.layout as object) ?? {}) },
			filter: layer.filter,
			minzoom: layer.minzoom as number | undefined,
			maxzoom: layer.maxzoom as number | undefined,
			metadata: layer.metadata
		};
		const at = before ? this.layers.findIndex(l => l.id === before) : -1;
		if (at === -1) {
			this.layers.push(entry);
		} else {
			this.layers.splice(at, 0, entry);
		}
		return this;

	}

	getLayer(id: string) {
		return this.layers.find(l => l.id === id);
	}

	removeLayer(id: string) {

		const at = this.layers.findIndex(l => l.id === id);
		if (at === -1) {
			throw new Error(`FakeMap: layer "${id}" does not exist`);
		}
		this.layers.splice(at, 1);
		return this;

	}

	setPaintProperty(layerId: string, name: string, value: unknown) {
		this.requireLayer(layerId).paint[name] = value;
		return this;
	}

	setLayoutProperty(layerId: string, name: string, value: unknown) {
		this.requireLayer(layerId).layout[name] = value;
		return this;
	}

	getLayoutProperty(layerId: string, name: string) {
		return this.requireLayer(layerId).layout[name];
	}

	setFilter(layerId: string, filter: unknown) {
		this.requireLayer(layerId).filter = filter;
		return this;
	}

	setLayerZoomRange(layerId: string, min: number, max: number) {
		const layer = this.requireLayer(layerId);
		layer.minzoom = min;
		layer.maxzoom = max;
		return this;
	}

	private requireLayer(id: string): FakeLayer {

		const layer = this.getLayer(id);
		if (!layer) {
			throw new Error(`FakeMap: layer "${id}" does not exist`);
		}
		return layer;

	}

	/* --------------------------------------------------------------- camera */

	getCenter() {
		return this.center;
	}
	setCenter(v: { lng: number; lat: number } | [number, number]) {
		this.center = Array.isArray(v) ? { lng: v[0], lat: v[1] } : v;
		return this;
	}
	getZoom() {
		return this.zoom;
	}
	setZoom(v: number) {
		this.zoom = v;
		return this;
	}
	getBearing() {
		return this.bearing;
	}
	setBearing(v: number) {
		this.bearing = v;
		return this;
	}
	getPitch() {
		return this.pitch;
	}
	setPitch(v: number) {
		this.pitch = v;
		return this;
	}
	getRoll() {
		return this.roll;
	}
	setRoll(v: number) {
		this.roll = v;
		return this;
	}
	getBounds() {
		return this.bounds;
	}
	fitBounds(b: unknown) {
		this.bounds = b as typeof this.bounds;
		return this;
	}
	setMaxBounds(v: unknown) {
		this.maxBounds = v;
		return this;
	}
	setMinZoom(v: number) {
		this.minZoom = v;
		return this;
	}
	setMaxZoom(v: number) {
		this.maxZoom = v;
		return this;
	}
	setMinPitch(v: number) {
		this.minPitch = v;
		return this;
	}
	setMaxPitch(v: number) {
		this.maxPitch = v;
		return this;
	}
	setRenderWorldCopies(v: boolean) {
		this.renderWorldCopies = v;
		return this;
	}
	/*
	 * A linear, *invertible* projection — the draw plugin converts screen pixels to coordinates and back
	 * (`isNearby` works in pixels, not with maplibre feature queries), so constant stubs made every
	 * pointer test vacuous: everything was 0.5 pixels from everything else.
	 *
	 * Equirectangular with a fixed scale, y flipped like a screen. Not geographically meaningful, but
	 * `unproject(project(x)) === x`, which is the only property the plugin relies on.
	 */
	static readonly PROJECTION_SCALE = 10;

	project(lngLat: [number, number] | { lng: number; lat: number }) {
		const [lng, lat] = Array.isArray(lngLat) ? lngLat : [lngLat.lng, lngLat.lat];
		return { x: lng * FakeMap.PROJECTION_SCALE, y: -lat * FakeMap.PROJECTION_SCALE };
	}

	unproject(point: { x: number; y: number } | [number, number]) {
		const [x, y] = Array.isArray(point) ? point : [point.x, point.y];
		const lng = x / FakeMap.PROJECTION_SCALE;
		const lat = -y / FakeMap.PROJECTION_SCALE;
		return { lng, lat, toArray: () => [lng, lat] };
	}
	resize() {
		return this;
	}

	/* ---------------------------------------------------------------- style */

	getStyle() {
		return this.style;
	}
	setStyle(style: unknown) {
		this.style = typeof style === 'string' ? { name: style } : (style as typeof this.style);
		return this;
	}
	setTerrain(v: unknown) {
		this.terrain = v;
		return this;
	}
	setSky(v: unknown) {
		this.sky = v;
		return this;
	}
	setLight(v: unknown) {
		this.light = v;
		return this;
	}
	setProjection(v: unknown) {
		this.projection = v;
		return this;
	}
	setTransformRequest(v: unknown) {
		this.transformRequest = v;
		return this;
	}
	setGlobalStateProperty(key: string, value: unknown) {
		this.globalState.set(key, value);
		return this;
	}
	addImage(id: string, image: unknown) {
		this.images.set(id, image);
	}
	updateImage(id: string, image: unknown) {
		this.images.set(id, image);
	}
	hasImage(id: string) {
		return this.images.has(id);
	}
	removeImage(id: string) {
		this.images.delete(id);
	}
	queryRenderedFeatures() {
		return [];
	}

	/* -------------------------------------------------------------- controls */

	/*
	 * maplibre appends whatever `onAdd` returns into the map container, and control code relies on that:
	 * `MglCustomControl` and `MglStyleSwitchControl` teleport their slots into it, and
	 * `MglFrameRateControl`'s `onRemove` reaches for `parentNode`. Keeping the element out of the DOM made
	 * a teleport target unreachable and a removal throw, so the fake attaches it too.
	 */
	addControl(control: IControl) {

		this.controls.push(control);
		const element = control.onAdd?.(this as never);
		if (element) {
			this.controlContainer.append(element);
		}
		return this;

	}
	removeControl(control: IControl) {

		const at = this.controls.indexOf(control);
		if (at !== -1) {
			this.controls.splice(at, 1);
			control.onRemove?.(this as never);
		}
		return this;

	}
	hasControl(control: IControl) {
		return this.controls.includes(control);
	}

	getCanvas() {
		return this.canvas as unknown as HTMLCanvasElement;
	}
	getCanvasContainer() {
		return this.canvasContainer as unknown as HTMLElement;
	}

	/** Stands in for maplibre's control corners. In the document, so teleports and queries work. */
	readonly controlContainer: HTMLElement = (() => {
		const element = document.createElement('div');
		element.className = 'maplibregl-control-container';
		document.body.append(element);
		return element;
	})();

	remove() {
		this.removed = true;
		this.listeners.clear();
		this.layerListeners.clear();
	}

	/** Total live listener count — the assertion for "did teardown actually unsubscribe everything". */
	get listenerCount(): number {

		let n = 0;
		for (const set of this.listeners.values()) {
			n += set.size;
		}
		for (const set of this.layerListeners.values()) {
			n += set.size;
		}
		return n;

	}

}
