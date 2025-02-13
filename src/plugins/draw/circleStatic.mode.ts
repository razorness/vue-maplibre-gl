import { AbstractDrawMode } from '@/plugins/draw/mode.abstract.ts';
import type { DrawPlugin } from '@/plugins/draw/plugin.ts';
import type { DrawModel } from '@/plugins/draw/types.ts';
import { type GeoJSONSource, type Map, type PaddingOptions } from 'maplibre-gl';

export class CircleStaticMode extends AbstractDrawMode {

	private _model: DrawModel | undefined;
	private _container = document.createElement('div');
	private _circle: HTMLDivElement;

	constructor(plugin: DrawPlugin, map: Map, source: GeoJSONSource, model: DrawModel | undefined) {
		super(plugin, map, source);
		this.onViewportChange = this.onViewportChange.bind(this);

		this._model = model;
		this._container.classList.add('maplibregl-draw-circle-mode');
		this._circle = document.createElement('div');
		this._circle.classList.add('maplibregl-draw-circle-mode-circle');
		this._container.appendChild(this._circle);
		this.setPadding();
	}

	onViewportChange() {
		this._model = this.viewportToModel();
		this.emitOnUpdate(this._model);
	}

	viewportToModel() {
		const left      = this._container.offsetLeft + this._circle.offsetLeft,
			  top       = this._container.offsetTop + this._circle.offsetTop,
			  center    = this.map.unproject([ Math.round(left + (this._circle.offsetWidth / 2)), Math.round(top + (this._circle.offsetHeight / 2)) ]),
			  topCenter = this.map.unproject([ left, top ]),
			  radius    = Math.abs(topCenter.lat - center.lat),
			  pos       = center.toArray();

		return this.createCircle(pos, radius);
	}

	register(): void {
		this.map.getCanvasContainer().appendChild(this._container);
		this.map.on('dragend', this.onViewportChange);
		this.map.on('zoomend', this.onViewportChange);
	}

	unregister(): void {
		this.map.getCanvasContainer().removeChild(this._container);
		this.map.off('dragend', this.onViewportChange);
		this.map.off('zoomend', this.onViewportChange);
	}

	setModel(model: DrawModel | undefined): void {
		if (model?.properties.meta === 'circle') {
			this._model = this.createCircle(model.properties.center!, model.properties.radius!);
		} else {
			this._model = undefined;
		}
	}

	setPadding() {
		const padding = this.plugin.options.fitBoundsOptions?.padding;
		switch (typeof padding) {
			case 'number':
				this._container.style.setProperty('--padding', `${padding}px`);
				break;
			case 'object':
				let side: keyof PaddingOptions;
				for (side in padding) {
					if (typeof padding[ side ] === 'number') {
						this._container.style.setProperty(`--padding-${side}`, `${padding[ side ]}px`);
					}
				}
				break;
		}
	}

}
