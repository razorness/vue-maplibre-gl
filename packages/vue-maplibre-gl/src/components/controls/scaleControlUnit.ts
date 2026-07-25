/**
 * Units maplibre's `ScaleControl` accepts.
 *
 * Lives in its own module rather than inside `MglScaleControl.vue`: an SFC can only export the
 * component itself, and this is a value the package re-exports.
 */
export const ScaleControlUnit = {
	IMPERIAL: 'imperial',
	METRIC: 'metric',
	NAUTICAL: 'nautical'
} as const;

export type ScaleControlUnit = (typeof ScaleControlUnit)[keyof typeof ScaleControlUnit];

export const ScaleControlUnitValues = Object.values(ScaleControlUnit);
