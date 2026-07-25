import type { IControl, Map as MMap } from 'maplibre-gl';
import { Position } from 'components/controls/position.enum';

/*
 * The control class lives here rather than inside `MglFrameRateControl.vue`: an SFC can only export the
 * component itself, and `FrameRateControl` is part of the public API — it is usable standalone with any
 * maplibre map, no Vue involved.
 */
export interface FrameRateControlOptions {
	background?: string;
	barWidth?: number;
	color?: string;
	font?: string;
	graphHeight?: number;
	graphWidth?: number;
	graphTop?: number;
	graphRight?: number;
	width?: number;
}

export class FrameRateControl implements IControl {

	private frames = 0;
	private totalTime = 0;
	private totalFrames = 0;

	private time: number | null = null;
	private map?: MMap;
	private container?: HTMLDivElement;
	private readOutput?: HTMLDivElement;
	private canvas?: HTMLCanvasElement;

	private eventHandlers = new Map<string, Function>();

	private background: string;
	private barWidth: number;
	private color: string;
	private font: string;
	private graphHeight: number;
	private graphWidth: number;
	private graphTop: number;
	private graphRight: number;
	private width: number;

	/*
	 * Written out rather than using parameter properties: those are not erasable syntax, and the
	 * `window.devicePixelRatio` defaults must stay lazy so the class can be imported during SSR.
	 */
	constructor(options: FrameRateControlOptions = {}) {

		this.background = options.background ?? 'rgba(0,0,0,0.9)';
		this.barWidth = options.barWidth ?? 4 * window.devicePixelRatio;
		this.color = options.color ?? '#7cf859';
		this.font = options.font ?? 'Monaco, Consolas, Courier, monospace';
		this.graphHeight = options.graphHeight ?? 60 * window.devicePixelRatio;
		this.graphWidth = options.graphWidth ?? 90 * window.devicePixelRatio;
		this.graphTop = options.graphTop ?? 0;
		this.graphRight = options.graphRight ?? 5 * window.devicePixelRatio;
		this.width = options.width ?? 100 * window.devicePixelRatio;

	}

	getDefaultPosition(): Position {
		return Position.TOP_RIGHT;
	}

	onAdd(map: MMap): HTMLElement {

		this.map = map;

		const el = (this.container = document.createElement('div'));
		el.className = 'maplibregl-ctrl maplibregl-ctrl-fps';

		el.style.backgroundColor = this.background;
		el.style.borderRadius = '6px';

		this.readOutput = document.createElement('div');
		this.readOutput.style.color = this.color;
		this.readOutput.style.fontFamily = this.font;
		this.readOutput.style.padding = '0 5px 5px';
		this.readOutput.style.fontSize = '9px';
		this.readOutput.style.fontWeight = 'bold';
		this.readOutput.textContent = 'Waiting…';

		this.canvas = document.createElement('canvas');
		this.canvas.className = 'maplibregl-ctrl-canvas';
		this.canvas.width = this.width;
		this.canvas.height = this.graphHeight;
		this.canvas.style.cssText = `width: ${this.width / window.devicePixelRatio}px; height: ${this.graphHeight / window.devicePixelRatio}px;`;

		el.appendChild(this.readOutput);
		el.appendChild(this.canvas);

		this.eventHandlers.set('movestart', this.onMoveStart.bind(this));
		this.eventHandlers.set('moveend', this.onMoveEnd.bind(this));
		this.map.on('movestart', this.eventHandlers.get('movestart') as any);
		this.map.on('moveend', this.eventHandlers.get('moveend') as any);
		return this.container;

	}

	onRemove(): void {

		this.map!.off('movestart', this.eventHandlers.get('movestart') as any);
		this.map!.off('moveend', this.eventHandlers.get('moveend') as any);
		this.eventHandlers.clear();
		this.container!.parentNode!.removeChild(this.container!);
		this.map = undefined;

	}

	onMoveStart() {
		this.frames = 0;
		this.time = performance.now();
		this.eventHandlers.set('render', this.onRender.bind(this));
		this.map!.on('render', this.eventHandlers.get('render') as any);
	}

	onMoveEnd() {

		const now = performance.now();
		this.updateGraph(this.getFPS(now));
		this.frames = 0;
		this.time = null;
		this.map!.off('render', this.eventHandlers.get('render') as any);

	}

	onRender() {

		if (this.time) {
			this.frames++;
			const now = performance.now();
			if (now >= this.time + 1e3) {
				this.updateGraph(this.getFPS(now));
				this.frames = 0;
				this.time = performance.now();
			}
		}

	}

	getFPS(now: number) {
		this.totalTime += now - this.time!;
		this.totalFrames += this.frames;
		return Math.round((1e3 * this.frames) / (now - this.time!)) || 0;
	}

	updateGraph(fpsNow: number) {

		const context = this.canvas!.getContext('2d')!;
		const fps = Math.round((1e3 * this.totalFrames) / this.totalTime) || 0;
		const rect = (this.graphHeight, this.barWidth);

		context.fillStyle = this.background;
		context.globalAlpha = 1;
		context.fillRect(0, 0, this.graphWidth, this.graphTop);
		context.fillStyle = this.color;

		this.readOutput!.textContent = `${fpsNow} FPS (${fps} Avg)`;
		context.drawImage(
			this.canvas!,
			this.graphRight + rect,
			this.graphTop,
			this.graphWidth - rect,
			this.graphHeight,
			this.graphRight,
			this.graphTop,
			this.graphWidth - rect,
			this.graphHeight
		);
		context.fillRect(this.graphRight + this.graphWidth - rect, this.graphTop, rect, this.graphHeight);
		context.fillStyle = this.background;
		context.globalAlpha = 0.75;
		context.fillRect(this.graphRight + this.graphWidth - rect, this.graphTop, rect, (1 - fpsNow / 100) * this.graphHeight);

	}

}
