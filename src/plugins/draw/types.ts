import type { FitBoundsOptions } from '@/types.ts';
import type { Feature, Polygon, Position } from 'geojson';
import type { LayerSpecification, LngLat } from 'maplibre-gl';

export enum DrawMode {
	POLYGON       = 'POLYGON',
	CIRCLE        = 'CIRCLE',
	CIRCLE_STATIC = 'CIRCLE_STATIC',
}

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

type WithoutSource<T> = T extends any ? Omit<T, 'source'> : never;
export type DrawStyle = WithoutSource<LayerSpecification>

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
