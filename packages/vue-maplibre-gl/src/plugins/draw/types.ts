import type { Feature, Polygon, Position } from 'geojson';
import type { DistributiveOmit, LayerSpecification, LngLat } from 'maplibre-gl';
import type { FitBoundsOptions } from 'types';

/*
 * `const` object + same-named type instead of an `enum`: erasable, no emitted runtime helper, and
 * `DrawMode.POLYGON` / `mode: DrawMode` keep working exactly as before.
 */
export const DrawMode = {
	POLYGON: 'POLYGON',
	CIRCLE: 'CIRCLE',
	CIRCLE_STATIC: 'CIRCLE_STATIC'
} as const;

export type DrawMode = (typeof DrawMode)[keyof typeof DrawMode];

export interface DrawPluginOptions {
	mode?: DrawMode;
	styles?: DrawStyle[];
	onUpdate?: OnUpdateHandler;
	autoZoom?: boolean; // true: automatic zoom an model changes and so on. false: you have to handle zoom on our own. default: true
	fitBoundsOptions?: FitBoundsOptions;
	minArea?: {
		size?: number; // m²
		color?: string; // default: #e74b3c
		label?: string;
	};
	pointerPrecision?: PointerPrecisionOption;
	waitForSetup?: boolean;
	circleMode?: {
		creationSize: number; // default: 75 pixels
	};
}

export interface PointerPrecisionOption {
	mouse: number; // default 24px
	touch: number; // default 36px
}

/**
 * A layer specification without `source` — the plugin fills that in with its own source id.
 *
 * Uses maplibre's exported `DistributiveOmit` rather than a hand-rolled `T extends any ? Omit<…>`,
 * which is the same thing but ours to maintain. It has to distribute over the union: a plain
 * `Omit<LayerSpecification, 'source'>` collapses the ten layer kinds into one object type and loses the
 * discrimination between `paint` shapes.
 */
export type DrawStyle = DistributiveOmit<LayerSpecification, 'source'>;

export interface DrawFeatureProperties {
	center?: Position;
	radius?: number; // meters
	area?: number; // m²
	tooSmall?: boolean;
	minSizeLabel?: string;
	hasHelperVertex?: boolean;
	meta: 'polygon' | 'circle' | 'vertex' | 'midpoint';
}

export interface DrawModeSnapshot {
	polygon: Position[];
	point?: Position;
	start: LngLat;
}

export type DrawModel = Feature<Polygon, DrawFeatureProperties>;
export type OnUpdateHandler = (m: DrawModel) => void;
