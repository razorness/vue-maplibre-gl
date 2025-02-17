import type { DrawStyle } from '@/plugins/draw/types.ts';

export const DefaultDrawStyles: DrawStyle[] = [
	// ACTIVE (being drawn)
	// line stroke
	{
		id    : 'gl-draw-line',
		type  : 'line',
		filter: [ 'all', [ '==', '$type', 'LineString' ], [ '!=', 'mode', 'static' ] ],
		layout: {
			'line-cap' : 'round',
			'line-join': 'round'
		},
		paint : {
			'line-color'    : '#e74b3c',
			'line-dasharray': [ 0.2, 2 ],
			'line-width'    : 2
		}
	},
	// polygon fill
	{
		id    : 'gl-draw-polygon-fill',
		type  : 'fill',
		filter: [ 'all', [ '==', '$type', 'Polygon' ], [ '!=', 'mode', 'static' ] ],
		paint : {
			'fill-color'        : '#3c99e7',
			'fill-outline-color': '#3c99e7',
			'fill-opacity'      : 0.1
		}
	},
	// polygon fill below min area size
	{
		id    : 'gl-draw-polygon-fill-below-min-area-size',
		type  : 'fill',
		filter: [ 'all', [ '==', '$type', 'Polygon' ], [ '==', 'tooSmall', true ] ],
		paint : {
			'fill-pattern': 'maplibre-draw-min-area-pattern'
		}
	},
	// polygon label below min area size
	{
		id    : 'gl-draw-polygon-fill-below-min-area-size-label',
		type  : 'symbol',
		filter: [ 'all', [ '==', '$type', 'Polygon' ], [ '==', 'tooSmall', true ], [ 'has', 'minSizeLabel' ] ],
		layout: {
			'text-field'      : [ 'get', 'minSizeLabel' ],
			'text-font'       : [ 'Open Sans Bold' ],
			'text-size'       : 24,
			'text-justify'    : 'center',
			'text-anchor'     : 'center'
		},
		paint : {
			'text-color'     : '#e74b3c',
			'text-halo-color': '#fff',
			'text-halo-width': 3
		}
	},
	// polygon mid points
	{
		id    : 'gl-draw-polygon-midpoint',
		type  : 'circle',
		filter: [ 'all',
				  [ '==', '$type', 'Point' ],
				  [ '==', 'meta', 'midpoint' ] ],
		paint : {
			'circle-radius': 4,
			'circle-color' : '#e74b3c'
		}
	},
	// polygon outline stroke
	// This doesn't style the first edge of the polygon, which uses the line stroke styling instead
	{
		id    : 'gl-draw-polygon-stroke-active',
		type  : 'line',
		filter: [ 'all', [ '==', '$type', 'Polygon' ], [ '!=', 'mode', 'static' ] ],
		layout: {
			'line-cap' : 'round',
			'line-join': 'round'
		},
		paint : {
			'line-color'    : '#e74b3c',
			'line-dasharray': [ 0.2, 2 ],
			'line-width'    : 2
		}
	},
	// vertex point halos
	{
		id    : 'gl-draw-polygon-and-line-vertex-halo-active',
		type  : 'circle',
		filter: [ 'all', [ '==', 'meta', 'vertex' ], [ '==', '$type', 'Point' ], [ '!=', 'mode', 'static' ] ],
		paint : {
			'circle-radius': 8,
			'circle-color' : '#FFF'
		}
	},
	// vertex points
	{
		id    : 'gl-draw-polygon-and-line-vertex-active',
		type  : 'circle',
		filter: [ 'all', [ '==', 'meta', 'vertex' ], [ '==', '$type', 'Point' ], [ '!=', 'mode', 'static' ] ],
		paint : {
			'circle-radius': 5,
			'circle-color' : '#e74b3c'
		}
	},

	// INACTIVE (static, already drawn)
	// line stroke
	{
		id    : 'gl-draw-line-static',
		type  : 'line',
		filter: [ 'all', [ '==', '$type', 'LineString' ], [ '==', 'mode', 'static' ] ],
		layout: {
			'line-cap' : 'round',
			'line-join': 'round'
		},
		paint : {
			'line-color': '#000',
			'line-width': 3
		}
	},
	// polygon fill
	{
		id    : 'gl-draw-polygon-fill-static',
		type  : 'fill',
		filter: [ 'all', [ '==', '$type', 'Polygon' ], [ '==', 'mode', 'static' ] ],
		paint : {
			'fill-color'        : '#000',
			'fill-outline-color': '#000',
			'fill-opacity'      : 0.1
		}
	},
	// polygon outline
	{
		id    : 'gl-draw-polygon-stroke-static',
		type  : 'line',
		filter: [ 'all', [ '==', '$type', 'Polygon' ], [ '==', 'mode', 'static' ] ],
		layout: {
			'line-cap' : 'round',
			'line-join': 'round'
		},
		paint : {
			'line-color': '#000',
			'line-width': 3
		}
	}
];
