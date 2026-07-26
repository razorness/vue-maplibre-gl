import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import ApiTable from './components/ApiTable.vue';
import DemoMap from './components/DemoMap.vue';
import DemoCamera from './components/demos/DemoCamera.vue';
import DemoGlobe from './components/demos/DemoGlobe.vue';
import DemoMarkerPopup from './components/demos/DemoMarkerPopup.vue';
import DemoSourcesLayers from './components/demos/DemoSourcesLayers.vue';
import DemoStyleSwitch from './components/demos/DemoStyleSwitch.vue';
import './custom.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import 'vue-maplibre-gl/style.css';
import 'vue-maplibre-gl/draw.css';

/*
 * The library is *not* installed as a Vue plugin here. Every demo imports the components it uses, so
 * the docs exercise the same tree-shakeable import path a consumer would — a component missing from
 * `components/index.ts` breaks a demo instead of silently working through global registration.
 */
export default {
	extends: DefaultTheme,
	enhanceApp({ app }) {
		app.component('ApiTable', ApiTable);
		app.component('DemoMap', DemoMap);
		app.component('DemoSourcesLayers', DemoSourcesLayers);
		app.component('DemoCamera', DemoCamera);
		app.component('DemoMarkerPopup', DemoMarkerPopup);
		app.component('DemoStyleSwitch', DemoStyleSwitch);
		app.component('DemoGlobe', DemoGlobe);
	}
} satisfies Theme;
