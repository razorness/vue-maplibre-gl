// Import vue components
import * as components from '@/components';
import type { App, Plugin } from 'vue';
import '@/css/maplibre.scss';

// install function executed by Vue.use()
const install: Exclude<Plugin['install'], undefined> = function installVueMaplibreGl(app: App) {
	Object.entries(components).forEach(([ componentName, component ]) => {
		app.component(componentName, component);
	});
};

// Create module definition for Vue.use()
export default install;

// To allow individual component use, export components
// each can be registered via Vue.component()
export * from '@/components';

// addition exports
export * from '@/types';
export { useMap, type MapInstance } from '@/lib/mapRegistry';
export { defaults as MglDefaults } from '@/defaults';
export { Position } from '@/components/controls/position.enum';
export { usePositionWatcher } from '@/composable/usePositionWatcher';
export { useSource } from '@/composable/useSource';
export { useDisposableLayer } from '@/composable/useDisposableLayer';

export * from '@/plugins/draw';
