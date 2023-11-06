import { Map, MapOptions, MarkerOptions, PopupOptions } from 'maplibre-gl';
import { MglMap } from '@/lib/components';
import { MglEvent } from '@/lib/types';

export type MapEventHandler = (e: any) => void;

export class MapLib {

	static readonly MAP_OPTION_KEYS: Array<keyof MapOptions | 'mapStyle'> = [
		'antialias', 'attributionControl', 'bearing', 'bearingSnap', 'bounds', 'boxZoom', 'center', 'clickTolerance', 'collectResourceTiming',
		'crossSourceCollisions', 'container', 'customAttribution', 'dragPan', 'dragRotate', 'doubleClickZoom', 'hash', 'fadeDuration',
		'failIfMajorPerformanceCaveat', 'fitBoundsOptions', 'interactive', 'keyboard', 'locale', 'localIdeographFontFamily', 'logoPosition', 'maxBounds',
		'maxPitch', 'maxZoom', 'minPitch', 'minZoom', 'preserveDrawingBuffer', 'pitch', 'pitchWithRotate', 'refreshExpiredTiles', 'renderWorldCopies',
		'scrollZoom', 'mapStyle', 'trackResize', 'transformRequest', 'touchZoomRotate', 'touchPitch', 'zoom', 'maxTileCacheSize', 'pixelRatio',
		'cooperativeGestures'
	];

	static readonly MARKER_OPTION_KEYS: Array<keyof MarkerOptions> = [
		'element', 'offset', 'anchor', 'color', 'draggable', 'clickTolerance', 'rotation', 'rotationAlignment', 'pitchAlignment', 'scale'
	];

	static readonly POPUP_OPTION_KEYS: Array<keyof PopupOptions> = [
          'closeButton', 'closeOnClick', 'closeOnMove', 'focusAfterOpen', 'anchor', 'offset', 'className', 'maxWidth'
	];

	static readonly MAP_EVENT_TYPES = [
		'error', 'load', 'idle', 'remove', 'render', 'resize', 'webglcontextlost', 'webglcontextrestored', 'dataloading', 'data', 'tiledataloading',
		'sourcedataloading', 'styledataloading', 'sourcedata', 'styledata', 'boxzoomcancel', 'boxzoomstart', 'boxzoomend', 'touchcancel', 'touchmove',
		'touchend', 'touchstart', 'click', 'contextmenu', 'dblclick', 'mousemove', 'mouseup', 'mousedown', 'mouseout', 'mouseover', 'movestart', 'move',
		'moveend', 'zoomstart', 'zoom', 'zoomend', 'rotatestart', 'rotate', 'rotateend', 'dragstart', 'drag', 'dragend', 'pitchstart', 'pitch', 'pitchend',
		'wheel'
	];

	static createEventHandler(component: InstanceType<typeof MglMap>, map: Map, ctx: {
		emit: (t: string, payload: any) => void
	}, eventName: string): MapEventHandler {
		return (payload = {}) => ctx.emit(eventName, { type: payload.type, map, component, event: payload } as MglEvent);
	}

}
