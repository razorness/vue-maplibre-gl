# Controls

Controls are the one part of the API that is component-only — they have to render. Position is a prop on
every one of them, and none of them removes itself: adding, moving and removing is owned centrally, so the
private `map._controls` array this library used to reach into is no longer touched.

<ApiTable name="MglNavigationControl" />
<ApiTable name="MglScaleControl" />
<ApiTable name="MglAttributionControl" />
<ApiTable name="MglFullscreenControl" />
<ApiTable name="MglGeolocationControl" />
<ApiTable name="MglGlobeControl" />
<ApiTable name="MglTerrainControl" />
<ApiTable name="MglLogoControl" />
<ApiTable name="MglFrameRateControl" />
<ApiTable name="MglStyleSwitchControl" />
<ApiTable name="MglCustomControl" />
