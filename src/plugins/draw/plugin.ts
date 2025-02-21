import { CircleMode } from '@/plugins/draw/circle.mode.ts';
import { CircleStaticMode } from '@/plugins/draw/circleStatic.mode.ts';
import type { AbstractDrawMode } from '@/plugins/draw/mode.abstract.ts';
import { PolygonMode } from '@/plugins/draw/polygon.mode.ts';
import { DefaultDrawStyles } from '@/plugins/draw/styles.ts';
import { DrawMode, type DrawModel, type DrawPluginOptions, type DrawStyle, type OnUpdateHandler } from '@/plugins/draw/types.ts';
import bbox from '@turf/bbox';
import clone from '@turf/clone';
import type { GeoJSONSource, LayerSpecification, LngLatBoundsLike, Map } from 'maplibre-gl';

export class DrawPlugin {

	static readonly SOURCE_ID           = 'mgl-draw-plugin';
	static readonly MIN_AREA_PATTERN_ID = 'maplibre-draw-min-area-pattern';

	map: Map;

	private _model: DrawModel | undefined;
	private _mode: DrawMode;
	private _modeInstance: AbstractDrawMode | undefined;
	private _source: GeoJSONSource | undefined;
	options: DrawPluginOptions & Required<Pick<DrawPluginOptions, 'styles' | 'pointerPrecision' | 'minArea' | 'circleMode'>>;

	constructor(map: Map, model: DrawModel | undefined, options: DrawPluginOptions = {}) {
		this.map     = map;
		this._model  = model ? this.prepareModel(model) : undefined;
		this._mode   = options.mode ?? DrawMode.POLYGON;
		this.options = {
			...options,
			styles          : options.styles ?? DefaultDrawStyles,
			autoZoom        : options.autoZoom ?? true,
			minArea         : options.minArea ?? {},
			pointerPrecision: {
				mouse: 24,
				touch: 36,
				...(options.pointerPrecision || {})
			},
			circleMode      : {
				creationSize: 75,
				...(options.circleMode || {})
			}
		};

		this.setup       = this.setup.bind(this);
		this.zoomToModel = this.zoomToModel.bind(this);

		if (!options.waitForSetup) {
			this.setup();
		}
	}

	get mode(): DrawMode {
		return this._mode;
	}

	setMode(value: DrawMode, model?: DrawModel) {
		this._model = model ? this.prepareModel(model) : undefined;
		if (this._mode !== value) {
			this._mode = value;
			this.setupMode();
		}
	}

	private setupMode() {

		if (this._modeInstance) {
			this._modeInstance.unregister();
			this._modeInstance.clear();
		}
		switch (this._mode) {
			case DrawMode.POLYGON:
				this._modeInstance = new PolygonMode(this, this.map, this._source!, this._model);
				break;
			case DrawMode.CIRCLE:
				this._modeInstance = new CircleMode(this, this.map, this._source!, this._model);
				break;
			case DrawMode.CIRCLE_STATIC:
				this._modeInstance = new CircleStaticMode(this, this.map, this._source!, this._model);
				break;
			default:
				throw new Error(`Unsupported mode "${this._mode}"`);
		}
		this.zoomToModel();
		if (this._modeInstance) {
			this._modeInstance.register();
			this._modeInstance.render();
		}

	}

	private setupMap() {
		this._source = this.map.getSource(DrawPlugin.SOURCE_ID);
		if (!this._source) {
			this.map.addSource(DrawPlugin.SOURCE_ID, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
			this._source = this.map.getSource(DrawPlugin.SOURCE_ID);
			this.setupStyles();
			this.map.on('resize', this.zoomToModel);
		}
		if (this._modeInstance) {
			this._modeInstance.source = this._source!;
		}
	}

	private setupStyles() {
		for (let i = 0, len = this.options.styles.length; i < len; i++) {
			this.map.addLayer({ ...this.options.styles[ i ], source: DrawPlugin.SOURCE_ID, } as LayerSpecification);
		}
	}

	setStyles(styles: DrawStyle[]) {
		this.removeStyles();
		this.options.styles = styles;
		this.setupStyles();
	}

	setOnUpdate(handler: OnUpdateHandler) {
		this.options.onUpdate = handler;
	}

	setModel(model: DrawModel | undefined) {
		this._model = model ? this.prepareModel(model) : undefined;
		this._modeInstance?.setModel(this._model);
		this.zoomToModel();
	}

	setMinAreaSize(size: number | undefined) {
		this.options.minArea.size = size;
		if (size) {
			this.setMinAreaSizePattern();
		}
	}

	setMinAreaColor(color: string | undefined) {
		this.options.minArea.color = color;
		if (this.options.minArea.size) {
			this.setMinAreaSizePattern();
		}
	}

	setMinAreaLabel(label: string | undefined) {
		this.options.minArea.label = label;
		this._modeInstance?.onOptionsUpdate();
	}

	zoomToModel() {
		if (this._model && this.options.autoZoom) {
			this.map.fitBounds(bbox(this._model) as LngLatBoundsLike, this.options.fitBoundsOptions);
		}
	}

	setAutoZoom(autoZoom: boolean) {
		this.options.autoZoom = autoZoom;
	}

	private removeStyles() {
		for (let i = 0, len = this.options.styles.length; i < len; i++) {
			this.map.removeLayer(this.options.styles[ i ].id);
		}
	}

	setup() {
		this.setupMap();
		this.setupMode();
		if (this.options.minArea.size) {
			this.setMinAreaSizePattern();
		}
	}

	prepareModel(model: DrawModel): DrawModel {
		const m = clone(model);
		if (m.geometry.coordinates?.[ 0 ]?.length) {

			const start    = m.geometry.coordinates[ 0 ][ 0 ],
				  end      = m.geometry.coordinates[ 0 ][ m.geometry.coordinates[ 0 ].length - 1 ],
				  isClosed = start[ 0 ] === end[ 0 ] && end[ 1 ] === end[ 1 ];
			if (!isClosed) {
				m.geometry.coordinates[ 0 ].push(m.geometry.coordinates[ 0 ][ 0 ]);
			}
		}
		return m;
	}

	private setMinAreaSizePattern() {

		const patternCanvas = document.createElement('canvas');
		const ctx           = patternCanvas.getContext('2d', { antialias: true }) as CanvasRenderingContext2D;

		const ratio            = window.devicePixelRatio || 1;
		const canvasSideLength = 12 * ratio;
		const width            = canvasSideLength;
		const height           = canvasSideLength;
		const divisions        = 16 * ratio;

		patternCanvas.width  = width;
		patternCanvas.height = height;
		ctx.fillStyle        = this.options.minArea.color || '#e74b3c';

		ctx.translate(width / 2, height / 2);
		ctx.rotate(Math.PI / 2);
		ctx.translate(-width / 2, -height / 2);

		// Top line
		ctx.beginPath();
		ctx.moveTo(0, height * (1 / divisions));
		ctx.lineTo(width * (1 / divisions), 0);
		ctx.lineTo(0, 0);
		ctx.lineTo(0, height * (1 / divisions));
		ctx.fill();

		// Middle line
		ctx.beginPath();
		ctx.moveTo(width, height * (1 / divisions));
		ctx.lineTo(width * (1 / divisions), height);
		ctx.lineTo(0, height);
		ctx.lineTo(0, height * ((divisions - 1) / divisions));
		ctx.lineTo(width * ((divisions - 1) / divisions), 0);
		ctx.lineTo(width, 0);
		ctx.lineTo(width, height * (1 / divisions));
		ctx.fill();

		// Bottom line
		ctx.beginPath();
		ctx.moveTo(width, height * ((divisions - 1) / divisions));
		ctx.lineTo(width * ((divisions - 1) / divisions), height);
		ctx.lineTo(width, height);
		ctx.lineTo(width, height * ((divisions - 1) / divisions));
		ctx.fill();

		const pattern = ctx.getImageData(0, 0, width, height);

		if (this.map.hasImage(DrawPlugin.MIN_AREA_PATTERN_ID)) {
			this.map.updateImage(DrawPlugin.MIN_AREA_PATTERN_ID, pattern);
		} else {
			this.map.addImage(DrawPlugin.MIN_AREA_PATTERN_ID, pattern, { pixelRatio: 2 * ratio });
		}

	}

	dispose() {
		this._modeInstance?.unregister();
		this.map.off('resize', this.zoomToModel);
		try {
			if (this.map) {
				for (let i = 0, len = this.options.styles.length; i < len; i++) {
					if (this.map.getLayer(this.options.styles[ i ].id)) {
						this.map.removeLayer(this.options.styles[ i ].id);
					}
				}
				if (this.map.getSource(DrawPlugin.SOURCE_ID)) {
					this.map.removeSource(DrawPlugin.SOURCE_ID);
				}
			}
		} catch (e) {
			// nothing
		}
	}

}
