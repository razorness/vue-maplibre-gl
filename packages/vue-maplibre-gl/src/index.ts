// Import vue components
import type { App, Plugin } from 'vue';
import * as components from 'components';
import 'css/index.css';

// install function executed by Vue.use()
const install: Exclude<Plugin['install'], undefined> = function installVueMaplibreGl(app: App) {
	Object.entries(components).forEach(([componentName, component]) => {
		app.component(componentName, component);
	});
};

// Create module definition for Vue.use()
export default install;

// To allow individual component use, export components
// each can be registered via Vue.component()
export * from 'components';

// addition exports
export * from 'types';
export { useMap, type MapInstance } from 'lib/mapRegistry';
export { defaults as MglDefaults } from '@/defaults';
export { Position } from 'components/controls/position.enum';
/*
 * Composables. `useSource`/`useLayer` hold the entire source/layer implementation — the matching
 * components are thin wrappers — so a project can build its own components without reimplementing the
 * lifecycle. All of them require an enclosing `<MglMap>`, whose provide/inject spine they read.
 */
export { usePositionWatcher } from 'composable/usePositionWatcher';
export { type MglMapOptions, useMglMap, type UseMglMapOptions, type UseMglMapReturn } from 'composable/useMglMap';
export { type MapOrRef, type MglMapContext, useMapContext } from 'composable/useMapContext';
export { type MglMarkerOptions, useMarker, type UseMarkerOptions, type UseMarkerReturn } from 'composable/useMarker';
export { usePopup, type UsePopupOptions, type UsePopupReturn } from 'composable/usePopup';
export { useSource, type UseSourceOptions, type UseSourceReturn } from 'composable/useSource';
export { useStyleSetting, type UseStyleSettingOptions } from 'composable/useStyleSetting';
export { useLayer, type UseLayerOptions, type UseLayerReturn } from 'composable/useLayer';
export { useDisposableLayer } from 'composable/useDisposableLayer';
export { onMapLoad, useLayerEvent, useMapEvent } from 'composable/useMapEvent';
export { useQueryRenderedFeatures, type UseQueryRenderedFeaturesReturn } from 'composable/useQueryRenderedFeatures';
export { type CameraModel, type CameraModelBinding, type CameraModelKey, useCameraModel } from 'composable/useCameraModel';
export { MglSourceRegistry, type SourceRef } from 'lib/sourceRegistry';
export { ControlRegistry } from 'lib/controlRegistry';
export { registeredMapCount, unregisterMap } from 'lib/mapRegistry';
export { applyLayerDiff, needsRecreate } from 'lib/layerDiff';
export { applySourceDiff, canApplyInPlace, type SourceDiffResult } from 'lib/sourceDiff';
export { applyMapDiff, applyMapOption, type LiveMapOption, type MapDiffContext } from 'lib/mapDiff';

/*
 * BREAKING (v6): the draw plugin is no longer re-exported here — it lives behind its own
 * subpath so that neither its code nor the @turf/* dependencies reach the main entry:
 *
 *   import { MglDrawControl } from 'vue-maplibre-gl/draw';
 *   import 'vue-maplibre-gl/draw.css';
 */
