import type { MglMap } from '@/components';
import type { MglEvent } from '@/types';
import type { Map, MapOptions, MarkerOptions } from 'maplibre-gl';

export type MapEventHandler = (e: any) => void;

export class MapLib {

	static readonly MAP_OPTION_KEYS: Array<keyof MapOptions | 'mapStyle'> = [
		'attributionControl', 'bearing', 'bearingSnap', 'bounds', 'boxZoom', 'cancelPendingTileRequestsWhileZooming', 'canvasContextAttributes', 'center',
		'centerClampedToGround', 'clickTolerance', 'collectResourceTiming', 'cooperativeGestures', 'crossSourceCollisions', 'doubleClickZoom', 'dragPan',
		'dragRotate', 'elevation', 'fadeDuration', 'fitBoundsOptions', 'hash', 'interactive', 'keyboard', 'locale', 'localIdeographFontFamily',
		'logoPosition', 'maplibreLogo', 'maxBounds', 'maxCanvasSize', 'maxPitch', 'maxTileCacheSize', 'maxTileCacheZoomLevels', 'maxZoom', 'minPitch', 'minZoom',
		'pitch', 'pitchWithRotate', 'pixelRatio', 'refreshExpiredTiles', 'renderWorldCopies', 'roll', 'rollEnabled', 'scrollZoom', 'touchPitch',
		'touchZoomRotate', 'trackResize', 'transformCameraUpdate', 'transformRequest', 'validateStyle', 'zoom',
		'mapStyle'
	];

	static readonly MARKER_OPTION_KEYS: Array<keyof MarkerOptions> = [
		'element', 'offset', 'anchor', 'color', 'draggable', 'clickTolerance', 'rotation', 'rotationAlignment', 'pitchAlignment', 'scale'
	];

	static readonly MAP_EVENT_TYPES = [
		'boxzoomcancel', 'boxzoomend', 'boxzoomstart', 'click', 'contextmenu', 'cooperativegestureprevented', 'data', 'dataabort', 'dataloading', 'dblclick',
		'drag', 'dragend', 'dragstart', 'error', 'idle', 'load', 'mousedown', 'mousemove', 'mouseout', 'mouseover', 'mouseup', 'move', 'moveend', 'movestart',
		'pitch', 'pitchend', 'pitchstart', 'projectiontransition', 'remove', 'render', 'resize', 'rotate', 'rotateend', 'rotatestart', 'sourcedata',
		'sourcedataabort', 'sourcedataloading', 'styledata', 'styledataloading', 'styleimagemissing', 'terrain', 'tiledataloading', 'touchcancel', 'touchend',
		'touchmove', 'touchstart', 'webglcontextlost', 'webglcontextrestored', 'wheel', 'zoom', 'zoomend', 'zoomstart'
	];

	static createEventHandler(component: InstanceType<typeof MglMap>, map: Map, ctx: {
		emit: (t: string, payload: any) => void
	}, eventName: string): MapEventHandler {
		return (payload = {}) => ctx.emit(eventName, { type: payload.type, map, component, event: payload } as MglEvent);
	}

}
