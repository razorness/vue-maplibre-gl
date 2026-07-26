import type { StyleSpecification } from 'maplibre-gl';

/*
 * The browser tests run against real maplibre, but deliberately not against a real tile server: a network
 * dependency would make them flaky in CI and unusable offline. These two styles are complete, valid
 * specifications that need nothing but a WebGL context.
 */

export const blankStyle: StyleSpecification = {
	version: 8,
	sources: {},
	layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#dfe6e9' } }],
	glyphs: 'https://example.invalid/{fontstack}/{range}.pbf'
};

/** A second style, so a switch is an actual change and the re-add sequence has something to prove. */
export const otherStyle: StyleSpecification = {
	version: 8,
	sources: {},
	layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#2d3436' } }],
	glyphs: 'https://example.invalid/{fontstack}/{range}.pbf'
};

export const points = {
	type: 'FeatureCollection' as const,
	features: [
		{ type: 'Feature' as const, properties: { name: 'a' }, geometry: { type: 'Point' as const, coordinates: [7.1, 50.7] } },
		{ type: 'Feature' as const, properties: { name: 'b' }, geometry: { type: 'Point' as const, coordinates: [13.4, 52.5] } }
	]
};

export const polygon = {
	type: 'Feature' as const,
	properties: {},
	geometry: {
		type: 'Polygon' as const,
		coordinates: [
			[
				[6, 50],
				[8, 50],
				[8, 52],
				[6, 52],
				[6, 50]
			]
		]
	}
};
