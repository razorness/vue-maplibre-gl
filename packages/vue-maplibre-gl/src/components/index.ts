/*
 * The generic components are the primary API; every Mgl*Source / Mgl*Layer below is a thin
 * named shim over one of them, kept so existing templates keep working.
 */
export { default as MglSource } from 'components/MglSource.vue';
export { default as MglLayer } from 'components/MglLayer.vue';

export { default as MglMap } from 'components/MglMap.vue';
export { default as MglAttributionControl } from 'components/controls/MglAttributionControl.vue';
export { default as MglCustomControl } from 'components/controls/MglCustomControl.vue';
export { default as MglFullscreenControl } from 'components/controls/MglFullscreenControl.vue';
export { default as MglGlobeControl } from 'components/controls/MglGlobeControl.vue';
export { default as MglLogoControl } from 'components/controls/MglLogoControl.vue';
export { default as MglTerrainControl } from 'components/controls/MglTerrainControl.vue';
export { default as MglFrameRateControl } from 'components/controls/MglFrameRateControl.vue';
export { default as MglGeolocationControl } from 'components/controls/MglGeolocationControl.vue';
export { default as MglNavigationControl } from 'components/controls/MglNavigationControl.vue';
export { default as MglScaleControl } from 'components/controls/MglScaleControl.vue';
export { default as MglStyleSwitchControl } from 'components/controls/MglStyleSwitchControl.vue';
export { default as MglButton } from 'components/MglButton.vue';
export { default as MglMarker } from 'components/MglMarker.vue';
export { default as MglPopup } from 'components/MglPopup.vue';

/* Declarative style-level settings — all built on `useStyleSetting`, so they survive a style switch. */
export { default as MglGlobalState } from 'components/style/MglGlobalState.vue';
export { default as MglImage } from 'components/style/MglImage.vue';
export { default as MglLight } from 'components/style/MglLight.vue';
export { default as MglProjection } from 'components/style/MglProjection.vue';
export { default as MglSky } from 'components/style/MglSky.vue';
export { default as MglTerrain } from 'components/style/MglTerrain.vue';
export { default as MglCanvasSource } from 'components/sources/MglCanvasSource.vue';
export { default as MglGeoJsonSource } from 'components/sources/MglGeoJsonSource.vue';
export { default as MglImageSource } from 'components/sources/MglImageSource.vue';
export { default as MglRasterSource } from 'components/sources/MglRasterSource.vue';
export { default as MglRasterDemSource } from 'components/sources/MglRasterDemSource.vue';
export { default as MglVectorSource } from 'components/sources/MglVectorSource.vue';
export { default as MglVideoSource } from 'components/sources/MglVideoSource.vue';
export { default as MglBackgroundLayer } from 'components/layers/MglBackgroundLayer.vue';
export { default as MglCircleLayer } from 'components/layers/MglCircleLayer.vue';
export { default as MglColorReliefLayer } from 'components/layers/MglColorReliefLayer.vue';
export { default as MglFillLayer } from 'components/layers/MglFillLayer.vue';
export { default as MglFillExtrusionLayer } from 'components/layers/MglFillExtrusionLayer.vue';
export { default as MglHeatmapLayer } from 'components/layers/MglHeatmapLayer.vue';
export { default as MglHillshadeLayer } from 'components/layers/MglHillshadeLayer.vue';
export { default as MglLineLayer } from 'components/layers/MglLineLayer.vue';
export { default as MglRasterLayer } from 'components/layers/MglRasterLayer.vue';
export { default as MglSymbolLayer } from 'components/layers/MglSymbolLayer.vue';
/*
 * Values that used to live inside a component module. An SFC can only export the component itself, so
 * anything else the package exposes moved into a sibling `.ts`.
 */
export { BUTTON_ICON_DEFAULTS, type ButtonIconDefaults, ButtonType, ButtonTypeValues } from 'components/buttonType';
export { Position, positionProp, type PositionProp, PositionValues } from 'components/controls/position.enum';
export { ScaleControlUnit, ScaleControlUnitValues } from 'components/controls/scaleControlUnit';
export { CustomControl } from 'components/controls/customControl';
export { FrameRateControl, type FrameRateControlOptions } from 'components/controls/frameRateControl';
