import type { ValidLanguages } from '@/types.ts';
import { type LayerSpecification, Map as MaplibreMap } from 'maplibre-gl';

const nameRegex = /\{name(:\S+)?\}/;

export function setPrimaryLanguage(map: MaplibreMap, lang: ValidLanguages | undefined) {

	const style = map.getStyle();
	if (!style?.layers) return;

	const langField = lang ? `name:${lang}` : 'name';

	function replaceTextField(expr: any): any {
		if (typeof expr === 'string') {
			if (nameRegex.test(expr)) {
				return [ 'coalesce', [ 'get', langField ], [ 'get', 'name' ] ];
			}
			return expr;
		} else if (Array.isArray(expr)) {
			const op = expr[ 0 ];
			if (op === 'get') {
				if (typeof expr[ 1 ] === 'string' && expr[ 1 ].startsWith('name')) {
					return [ 'coalesce', [ 'get', langField ], [ 'get', 'name' ] ];
				}
				return expr;
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
