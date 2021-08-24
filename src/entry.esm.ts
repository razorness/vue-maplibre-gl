import { App, Plugin } from 'vue';

// Import vue components
import * as components from '@/components/index';

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
export * from '@/components/index';

// addition exports
export * from '@/components/types';
export { useMap } from './components/mapRegistry';
export { defaults as MglDefaults } from './components/defaults';
export { usePositionWatcher, Position } from './components/controls/shared';

