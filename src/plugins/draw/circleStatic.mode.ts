import { throttle } from '@/lib/debounce.ts';
import { createElement } from '@/plugins/draw/html.ts';
import { AbstractDrawMode } from '@/plugins/draw/mode.abstract.ts';
import type { DrawPlugin } from '@/plugins/draw/plugin.ts';
import type { DrawModel } from '@/plugins/draw/types.ts';
import distance from '@turf/distance';
import { type GeoJSONSource, type Map, type PaddingOptions } from 'maplibre-gl';

export class CircleStaticMode extends AbstractDrawMode {

	private _model: DrawModel | undefined;
	private _container: HTMLDivElement;
	private _circle: HTMLDivElement;
	private _widthContstraint: HTMLDivElement;
	private _heightConstraint: HTMLDivElement;
	private _minSizeLabel: HTMLDivElement;

	constructor(plugin: DrawPlugin, map: Map, source: GeoJSONSource, model: DrawModel | undefined) {
		super(plugin, map, source);
		this.onViewportChangeEnd = this.onViewportChangeEnd.bind(this);
		this.onViewportChange    = throttle(this.onViewportChange.bind(this), 100);

		this._model = model;

		this._container        = createElement('div', 'maplibregl-draw-circle-mode');
		this._widthContstraint = createElement('div', 'maplibregl-draw-circle-mode-width-constraint');
		this._heightConstraint = createElement('div', 'maplibregl-draw-circle-mode-height-constraint');
		this._circle           = createElement('div', 'maplibregl-draw-circle-mode-circle');
		this._circle.innerHTML = `<svg class="maplibre-draw-min-area-pattern" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
    <defs>
        <pattern id="maplibre-draw-min-area-pattern" patternUnits="userSpaceOnUse" width="4.5" height="4.5" patternTransform="rotate(135)">
            <line x1="0" y="0" x2="0" y2="4.5" stroke="currentColor" stroke-width="1" />
        </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#maplibre-draw-min-area-pattern)" :opacity="1" />
</svg>`;
		this._minSizeLabel     = createElement('div', 'maplibre-draw-circle-mode-below-min-area-size-label');
		if (plugin.options.minArea.label) {
			this._minSizeLabel.textContent = plugin.options.minArea.label;
		}
		this._container.appendChild(this._heightConstraint);
		this._heightConstraint.appendChild(this._widthContstraint);
		this._widthContstraint.appendChild(this._circle);
		this._circle.appendChild(this._minSizeLabel);
		this.setPadding();
	}

	onViewportChange() {
		this._model = this.viewportToModel();
		if (this._model.properties.tooSmall) {
			this._circle.classList.add('maplibregl-draw-circle-too-small');
		} else {
			this._circle.classList.remove('maplibregl-draw-circle-too-small');
		}
	}


	onViewportChangeEnd() {
		this._model = this.viewportToModel();
		this.emitOnUpdate(this._model);
		if (this._model.properties.tooSmall) {
			this._circle.classList.add('maplibregl-draw-circle-too-small');
		} else {
			this._circle.classList.remove('maplibregl-draw-circle-too-small');
		}
		// to debug: make polygon visible on map
		// this.collection = { type: 'FeatureCollection', features: [ this._model ] };
		// this.render();
	}

	viewportToModel() {
		const left      = this._container.offsetLeft + this._circle.offsetLeft,
			  top       = this._container.offsetTop + this._circle.offsetTop,
			  center    = this.map.unproject([ left + (this._circle.offsetWidth / 2), top + (this._circle.offsetHeight / 2) ]),
			  topCenter = this.map.unproject([ left + (this._circle.offsetWidth / 2), top ]),
			  pos       = center.toArray(),
			  radius    = distance(topCenter.toArray(), pos, { units: 'meters' });

		return this.createCircle(pos, radius);
	}

	register(): void {
		this.map.getCanvasContainer().appendChild(this._container);
		this.map.on('dragend', this.onViewportChangeEnd);
		this.map.on('zoomend', this.onViewportChangeEnd);
		this.map.on('zoom', this.onViewportChange);
	}

	unregister(): void {
		this.map.getCanvasContainer().removeChild(this._container);
		this.map.off('dragend', this.onViewportChangeEnd);
		this.map.off('zoomend', this.onViewportChangeEnd);
		this.map.off('zoom', this.onViewportChange);
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

	onOptionsUpdate() {
		if (this.plugin.options.minArea.label) {
			this._minSizeLabel.textContent = this.plugin.options.minArea.label;
		}
	}

}
