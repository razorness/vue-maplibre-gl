import type { App } from 'vue';

// Import vue components
import * as components from '@/components/index';

// install function executed by Vue.use()
// Can be passed as either Vue.use(install) or Vue.use(thisModule)
export function install(app: App) {
	Object.entries(components).forEach(([componentName, component]) => {
		app.component(componentName, component);
	});
}

// To allow individual component use, export components
// each can be registered via Vue.component()
export * from '@/components/index';

// addition exports
export * from '@/components/types';
export { useMap } from './components/mapRegistry';
export { defaults as MglDefaults } from './components/defaults';
export { usePositionWatcher, Position } from './components/controls/shared';

export default install;
