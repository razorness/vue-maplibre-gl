declare module '@americana/diplomat' {

	export function getLanguageFromURL(url: URL): string | null;

	export function getLocales(): string[];

	export function getLocalizedNameExpression(locales: string[], options?: {
		includesLegacyFields?: boolean,
		unlocalizedNameProperty?: string,
		localizedNamePropertyFormat?: string
	}): string;

	export function updateVariable(letExpr: any[], variable: string, value: any): void

	export function replacePropertyReferences(expression: any[], propertyName: string, replacement: any,): any[];

	export function prepareLayer(layer: object, unlocalizedNameProperty: string, glossLocalNames: boolean): void

	export function localizeLayers(layers: object[], locales?: string[], options?: {
		unlocalizedNameProperty?: string,
		localizedNamePropertyFormat?: string
	}): void

	export function listValuesExpression(valueList: string, separator: string, valueToOmit?: any): any[];

	export const localizedNameWithLocalGloss: [
		'let',
		string,
		'',
		string,
		[ 'collator', {} ],
		string,
		[ 'collator', {} ],
		string,
	];

	export function getLocalizedCountryNames(locales: string[], options?: { uppercase?: boolean }): string[];

	export function getGlobalStateForLocalization(locales: string[], options?: { uppercaseCountryNames?: boolean }): object;

	export function localizeStyle(map: any, locales?: string[], options?: {
		layers?: string[],
		sourceLayers?: string[],
		unlocalizedNameProperty?: string,
		localizedNamePropertyFormat?: string,
		glossLocalNames?: boolean,
		uppercaseCountryNames?: boolean
	}): void;


}
