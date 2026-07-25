/**
 * Icon conventions `MglButton` knows how to size.
 *
 * In its own module rather than inside `MglButton.vue`: an SFC can only export the component, and these
 * are values the package re-exports.
 */
export const ButtonType = {
	DEFAULT: 'default',
	TEXT: 'text',
	MDI: 'mdi',
	SIMPLE_ICON: 'simple-icons'
} as const;

export type ButtonType = (typeof ButtonType)[keyof typeof ButtonType];

export const ButtonTypeValues = Object.values(ButtonType);

export interface ButtonIconDefaults {
	size: number;
	viewbox: string;
}

/** `TEXT` has no icon, hence no defaults. */
export const BUTTON_ICON_DEFAULTS: { [K in ButtonType]?: ButtonIconDefaults } = {
	[ButtonType.TEXT]: undefined,
	[ButtonType.MDI]: { size: 21, viewbox: '0 0 24 24' },
	[ButtonType.SIMPLE_ICON]: { size: 21, viewbox: '0 0 24 24' },
	[ButtonType.DEFAULT]: { size: 0, viewbox: '0 0 0 0' }
};
