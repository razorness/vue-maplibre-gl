import type { LayerSpecification, Map as MaplibreMap } from 'maplibre-gl';
import type { ValidLanguages } from 'types';

const nameRegex = /\{name(:\S+)?\}/;

export function setPrimaryLanguage(map: MaplibreMap, lang: ValidLanguages | undefined) {
	const style = map.getStyle();
	if (!style?.layers) return;

	const langField = lang ? `name:${lang}` : 'name';

	const coalesceForLanguage = () => ['coalesce', ['get', langField], ['get', 'name']];

	/** Recognises what an earlier call produced, so switching language twice does not nest twice. */
	const isGeneratedCoalesce = (expr: unknown[]): boolean =>
		expr.length === 3 &&
		expr.slice(1).every(part => Array.isArray(part) && part[0] === 'get' && typeof part[1] === 'string' && part[1].startsWith('name'));

	function replaceTextField(expr: any): any {
		if (typeof expr === 'string') {
			if (nameRegex.test(expr)) {
				return coalesceForLanguage();
			}
			return expr;
		} else if (Array.isArray(expr)) {
			const op = expr[0];
			if (op === 'get') {
				if (typeof expr[1] === 'string' && expr[1].startsWith('name')) {
					return coalesceForLanguage();
				}
				return expr;
			} else if (op === 'coalesce' && isGeneratedCoalesce(expr)) {
				/*
				 * A `coalesce` this function wrote on an earlier call. Replacing it wholesale is what makes
				 * repeated switching stable: descending into it would rewrite *both* of its `get`s — each of
				 * which still starts with `name` — and wrap the result again, so the expression grew by one
				 * level per language switch and never shrank.
				 */
				return coalesceForLanguage();
			} else if (op === 'concat' || op === 'format' || op === 'case') {
				return expr.map(replaceTextField);
			} else {
				return expr.map(replaceTextField);
			}
		}
		return expr;
	}

	style.layers.forEach((layer: LayerSpecification) => {
		if (layer.type !== 'symbol') return;
		const tf = map.getLayoutProperty(layer.id, 'text-field');
		if (!tf) return;

		const newTf = replaceTextField(tf);
		if (newTf) {
			map.setLayoutProperty(layer.id, 'text-field', newTf);
		}
	});
}
