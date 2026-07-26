/*
 * Shared style resolution for every demo. Falls back to demotiles, so the docs build and run without an
 * API key; set `VITE_MAP_STYLE_KEY` in `docs/.env.local` to point them at MapTiler instead.
 */
const key = import.meta.env.VITE_MAP_STYLE_KEY as string | undefined;

const maptiler = (name: string) => `https://api.maptiler.com/maps/${name}/style.json?key=${key}`;

export const demoStyle = key ? maptiler('streets-v2') : 'https://demotiles.maplibre.org/style.json';

/** Styles for the style-switch demo. Without a key there is only one real style to offer. */
export const demoStyles = key
	? [
			{ name: 'streets', label: 'Streets', style: maptiler('streets-v2') },
			{ name: 'basic', label: 'Basic', style: maptiler('basic-v2') },
			{ name: 'satellite', label: 'Satellite', style: maptiler('satellite') }
		]
	: [
			{ name: 'demotiles', label: 'Demo tiles', style: 'https://demotiles.maplibre.org/style.json' },
			{
				name: 'blank',
				label: 'Blank',
				style: {
					version: 8 as const,
					sources: {},
					layers: [{ id: 'bg', type: 'background' as const, paint: { 'background-color': '#e9e4dc' } }]
				}
			}
		];
