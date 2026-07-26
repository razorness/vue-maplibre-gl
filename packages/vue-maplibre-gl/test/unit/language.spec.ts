import { beforeEach, describe, expect, it } from 'vitest';
import { setPrimaryLanguage } from 'lib/language';
import { FakeMap } from '@test/fake-map';

/*
 * `setPrimaryLanguage` rewrites every symbol layer's `text-field` into
 * `['coalesce', ['get', 'name:xx'], ['get', 'name']]`. It only works against a style whose tiles carry
 * `name:xx` fields, and it has to cope with the three forms a real style uses: the `{name}` template
 * string, a bare `['get', 'name']`, and those nested inside `concat`/`format`/`case`.
 */
function mapWithLayers(layers: Array<{ id: string; type: string; textField?: unknown }>) {
	const map = new FakeMap({ container: document.createElement('div') } as never);
	map.setStyle({ layers: layers.map(({ id, type }) => ({ id, type })) } as never);
	for (const layer of layers) {
		map.addLayer({ id: layer.id, type: layer.type, source: 's', layout: { 'text-field': layer.textField } } as never);
	}
	return map;
}

const textFieldOf = (map: FakeMap, id: string) => map.getLayoutProperty(id, 'text-field');

const coalesced = (lang: string) => ['coalesce', ['get', lang], ['get', 'name']];

beforeEach(() => FakeMap.reset());

describe('setPrimaryLanguage', () => {
	it('rewrites a {name} template string', () => {
		const map = mapWithLayers([{ id: 'labels', type: 'symbol', textField: '{name}' }]);

		setPrimaryLanguage(map as never, 'de');

		expect(textFieldOf(map, 'labels')).toEqual(coalesced('name:de'));
	});

	it('rewrites a {name:xx} template string', () => {
		const map = mapWithLayers([{ id: 'labels', type: 'symbol', textField: '{name:fr}' }]);

		setPrimaryLanguage(map as never, 'de');

		expect(textFieldOf(map, 'labels')).toEqual(coalesced('name:de'));
	});

	it('rewrites a bare get expression', () => {
		const map = mapWithLayers([{ id: 'labels', type: 'symbol', textField: ['get', 'name'] }]);

		setPrimaryLanguage(map as never, 'es');

		expect(textFieldOf(map, 'labels')).toEqual(coalesced('name:es'));
	});

	it('rewrites a get expression nested in concat', () => {
		const map = mapWithLayers([{ id: 'labels', type: 'symbol', textField: ['concat', ['get', 'name'], ' — ', ['get', 'ref']] }]);

		setPrimaryLanguage(map as never, 'it');

		expect(textFieldOf(map, 'labels')).toEqual(['concat', coalesced('name:it'), ' — ', ['get', 'ref']]);
	});

	it('rewrites inside format and case', () => {
		const map = mapWithLayers([
			{ id: 'formatted', type: 'symbol', textField: ['format', ['get', 'name'], { 'font-scale': 1.2 }] },
			{ id: 'cased', type: 'symbol', textField: ['case', ['has', 'name'], ['get', 'name'], ''] }
		]);

		setPrimaryLanguage(map as never, 'pt');

		expect(textFieldOf(map, 'formatted')).toEqual(['format', coalesced('name:pt'), { 'font-scale': 1.2 }]);
		expect(textFieldOf(map, 'cased')).toEqual(['case', ['has', 'name'], coalesced('name:pt'), '']);
	});

	it('falls back to plain name when no language is given', () => {
		const map = mapWithLayers([{ id: 'labels', type: 'symbol', textField: '{name}' }]);

		setPrimaryLanguage(map as never, undefined);

		expect(textFieldOf(map, 'labels')).toEqual(['coalesce', ['get', 'name'], ['get', 'name']]);
	});

	it('leaves a get on an unrelated property alone', () => {
		const map = mapWithLayers([{ id: 'labels', type: 'symbol', textField: ['get', 'ref'] }]);

		setPrimaryLanguage(map as never, 'de');

		expect(textFieldOf(map, 'labels')).toEqual(['get', 'ref']);
	});

	it('touches only symbol layers', () => {
		const map = mapWithLayers([
			{ id: 'fill', type: 'fill', textField: '{name}' },
			{ id: 'labels', type: 'symbol', textField: '{name}' }
		]);

		setPrimaryLanguage(map as never, 'de');

		expect(textFieldOf(map, 'fill')).toBe('{name}');
		expect(textFieldOf(map, 'labels')).toEqual(coalesced('name:de'));
	});

	it('skips a symbol layer without a text-field', () => {
		const map = mapWithLayers([{ id: 'icons', type: 'symbol' }]);

		expect(() => setPrimaryLanguage(map as never, 'de')).not.toThrow();
		expect(textFieldOf(map, 'icons')).toBeUndefined();
	});

	it('does nothing when the style has no layers', () => {
		const map = new FakeMap({ container: document.createElement('div') } as never);

		expect(() => setPrimaryLanguage(map as never, 'de')).not.toThrow();
	});

	/*
	 * Repeated switching used to nest: the rewrite works on whatever the previous pass left behind, and what
	 * it left behind was a `coalesce` whose two `get`s both start with `name` — so both were rewritten and
	 * the result wrapped again, one level deeper per switch, growing without bound. That expression is now
	 * recognised and replaced wholesale.
	 */
	it('stays flat when the language is switched several times', () => {
		const map = mapWithLayers([{ id: 'labels', type: 'symbol', textField: '{name}' }]);

		setPrimaryLanguage(map as never, 'de');
		const afterFirst = textFieldOf(map, 'labels');
		setPrimaryLanguage(map as never, 'fr');
		setPrimaryLanguage(map as never, 'ja');

		expect(afterFirst).toEqual(coalesced('name:de'));
		expect(textFieldOf(map, 'labels')).toEqual(coalesced('name:ja'));
	});

	it('is idempotent for the same language', () => {
		const map = mapWithLayers([{ id: 'labels', type: 'symbol', textField: '{name}' }]);

		setPrimaryLanguage(map as never, 'de');
		const once = JSON.stringify(textFieldOf(map, 'labels'));
		setPrimaryLanguage(map as never, 'de');

		expect(JSON.stringify(textFieldOf(map, 'labels'))).toBe(once);
	});

	it('switches back to the plain name after a language was set', () => {
		const map = mapWithLayers([{ id: 'labels', type: 'symbol', textField: '{name}' }]);

		setPrimaryLanguage(map as never, 'de');
		setPrimaryLanguage(map as never, undefined);

		expect(textFieldOf(map, 'labels')).toEqual(['coalesce', ['get', 'name'], ['get', 'name']]);
	});
});
