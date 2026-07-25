import type { Map as MaplibreMap, StyleSpecification } from 'maplibre-gl';
import type { FitBoundsOptions } from 'types';

/**
 * The subset of `MapOptions` that can be changed on a live map, and the setter for each.
 *
 * Everything else is constructor-only: maplibre offers no way to change it afterwards, so those options
 * are read once when the map is created. Notably `hash`, `locale`, `pixelRatio`, `canvasContextAttributes`
 * and the handler toggles (`scrollZoom`, `dragPan`, …) — the latter are togglable through
 * `map.scrollZoom.enable()` and friends, which is a different shape and left to the consumer.
 */
export type LiveMapOption =
	| 'bearing'
	| 'bounds'
	| 'center'
	| 'maxBounds'
	| 'maxPitch'
	| 'maxZoom'
	| 'minPitch'
	| 'minZoom'
	| 'pitch'
	| 'projection'
	| 'renderWorldCopies'
	| 'roll'
	| 'style'
	| 'transformRequest'
	| 'zoom';

export interface MapDiffContext {
	/** `fitBounds` is only used for a `bounds` change when this says so. */
	fitBoundsOptions?: FitBoundsOptions;
	/**
	 * Called immediately before any camera-moving setter, so two-way bindings can suppress the echo.
	 * See `composable/useCameraModel.ts`.
	 */
	markProgrammatic?: () => void;
}

const CAMERA_OPTIONS = new Set<LiveMapOption>(['bearing', 'bounds', 'center', 'pitch', 'roll', 'zoom']);

/**
 * Applies a change to one map option using maplibre's matching setter.
 *
 * Returns `true` when the option was handled — `false` means it is constructor-only and the caller can
 * decide whether that is worth warning about.
 */
export function applyMapOption(map: MaplibreMap, key: string, value: unknown, context: MapDiffContext = {}): boolean {
	if (value === undefined) {
		return CAMERA_OPTIONS.has(key as LiveMapOption);
	}

	if (CAMERA_OPTIONS.has(key as LiveMapOption)) {
		context.markProgrammatic?.();
	}

	switch (key as LiveMapOption) {
		case 'bearing':
			map.setBearing(value as number);
			return true;
		case 'bounds':
			/*
			 * `useOnBoundsUpdate` exists because fitBounds animates: applying the padding/duration meant
			 * for the initial fit on every later bounds change is rarely what a consumer wants.
			 */
			map.fitBounds(value as never, context.fitBoundsOptions?.useOnBoundsUpdate ? context.fitBoundsOptions : undefined);
			return true;
		case 'center':
			map.setCenter(value as never);
			return true;
		case 'maxBounds':
			map.setMaxBounds(value as never);
			return true;
		case 'maxPitch':
			map.setMaxPitch(value as number);
			return true;
		case 'maxZoom':
			map.setMaxZoom(value as number);
			return true;
		case 'minPitch':
			map.setMinPitch(value as number);
			return true;
		case 'minZoom':
			map.setMinZoom(value as number);
			return true;
		case 'pitch':
			map.setPitch(value as number);
			return true;
		case 'projection':
			map.setProjection(value as never);
			return true;
		case 'renderWorldCopies':
			map.setRenderWorldCopies(value as boolean);
			return true;
		case 'roll':
			map.setRoll(value as number);
			return true;
		case 'style':
			/*
			 * `diff: false` deliberately: maplibre does not fire `style.load` reliably with diffing on,
			 * and sources/layers depend on that event to re-add themselves.
			 * @see https://github.com/maplibre/maplibre-gl-js/issues/2587
			 */
			map.setStyle(value as StyleSpecification | string, { diff: false });
			return true;
		case 'transformRequest':
			map.setTransformRequest(value as never);
			return true;
		case 'zoom':
			map.setZoom(value as number);
			return true;
		default:
			return false;
	}
}

/**
 * Applies every option that changed between two snapshots.
 *
 * Returns the keys that changed but have no setter, so the caller can report them instead of leaving the
 * consumer wondering why nothing happened.
 */
export function applyMapDiff(
	map: MaplibreMap,
	previous: Record<string, unknown>,
	next: Record<string, unknown>,
	context: MapDiffContext = {}
): string[] {
	const ignored: string[] = [];

	for (const key of new Set([...Object.keys(previous), ...Object.keys(next)])) {
		if (previous[key] === next[key]) {
			continue;
		}
		if (!applyMapOption(map, key, next[key], context)) {
			ignored.push(key);
		}
	}

	return ignored;
}
