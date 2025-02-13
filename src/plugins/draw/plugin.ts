import { CircleMode } from '@/plugins/draw/circle.mode.ts';
import { CircleStaticMode } from '@/plugins/draw/circleStatic.mode.ts';
import type { AbstractDrawMode } from '@/plugins/draw/mode.abstract.ts';
import { PolygonMode } from '@/plugins/draw/polygon.mode.ts';
import { DefaultDrawStyles } from '@/plugins/draw/styles.ts';
import { DrawMode, type DrawModel, type DrawPluginOptions, type DrawStyle, type OnUpdateHandler } from '@/plugins/draw/types.ts';
import bbox from '@turf/bbox';
import type { GeoJSONSource, LayerSpecification, LngLatBoundsLike, Map } from 'maplibre-gl';

export class DrawPlugin {

	static readonly SOURCE_ID = 'mgl-draw-plugin';

	map: Map;

	private _model: DrawModel | undefined;
	private _mode: DrawMode;
	private _modeInstance: AbstractDrawMode | undefined;
	private _source: GeoJSONSource | undefined;
	options: DrawPluginOptions & Required<Pick<DrawPluginOptions, 'styles'>>;

	constructor(map: Map, model: DrawModel | undefined, options: DrawPluginOptions = {}) {
		this.map     = map;
		this._model  = model;
		this._mode   = options.mode ?? DrawMode.POLYGON;
		this.options = {
			...options,
			styles      : options.styles ?? DefaultDrawStyles,
			zoomOnUpdate: true
		};

		this.setup       = this.setup.bind(this);
		this.zoomToModel = this.zoomToModel.bind(this);
		this.map.once('load', this.setup);
	}

	get mode(): DrawMode {
		return this._mode;
	}

	setMode(value: DrawMode, model?: DrawModel) {
		this._model = model;
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
		this._modeInstance?.register();

	}

	private setupMap() {

		this.map.addSource(DrawPlugin.SOURCE_ID, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
		this._source = this.map.getSource(DrawPlugin.SOURCE_ID);
		this.setupStyles();
		this.map.on('resize', this.zoomToModel);

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
		this._model = model;
		this._modeInstance?.setModel(model);
		if (model && this.options.zoomOnUpdate) {
			this.zoomToModel();
		}
	}

	zoomToModel() {
		if (this._model) {
			this.map.fitBounds(bbox(this._model) as LngLatBoundsLike, this.options.fitBoundsOptions);
		}
	}

	private removeStyles() {
		for (let i = 0, len = this.options.styles.length; i < len; i++) {
			this.map.removeLayer(this.options.styles[ i ].id);
		}
	}

	private setup() {
		this.setupMap();
		this.setupMode();
	}

	dispose() {
		this._modeInstance?.unregister();
		this.map.off('resize', this.zoomToModel);
		try {
			this.map?.removeSource(DrawPlugin.SOURCE_ID);
		} catch (e) {
			// nothing
		}
	}

}
