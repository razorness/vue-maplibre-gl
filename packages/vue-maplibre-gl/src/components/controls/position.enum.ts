/*
 * A `const` object plus a same-named type instead of a TS `enum`.
 *
 * Call sites are unchanged (`Position.TOP_RIGHT` and `v: Position` both still work), but this form is
 * fully erasable — required for `erasableSyntaxOnly` — emits no runtime helper, and tree-shakes.
 * It is also slightly more permissive than the enum was: a raw `'top-right'` is now accepted where
 * `Position` is expected, which is what `PositionProp` existed to express.
 */
export const Position = {
	TOP_LEFT: 'top-left',
	TOP_RIGHT: 'top-right',
	BOTTOM_LEFT: 'bottom-left',
	BOTTOM_RIGHT: 'bottom-right'
} as const;

export type Position = (typeof Position)[keyof typeof Position];

export const PositionValues = Object.values(Position);

/** @deprecated Identical to {@link Position}, which now already accepts the raw strings. */
export type PositionProp = Position;

/**
 * The `position` prop, shared by every control.
 *
 * Was declared identically — including the validator — in all eight control components.
 *
 * @param defaultPosition maplibre's own default differs per control, so it is passed in.
 */
export function positionProp(defaultPosition?: Position) {
	return {
		type: String as unknown as () => PositionProp,
		...(defaultPosition ? { default: defaultPosition } : {}),
		validator: (v: unknown) => PositionValues.includes(v as Position)
	};
}
