import { App, Component, Plugin } from 'vue';

// Import vue components
import * as components from '@/components/index';

export function isComponent(c: any): c is Component {
	return c && !!(c as Component).name && !!(c as Component).call;
}

// install function executed by Vue.use()
const install: Exclude<Plugin['install'], undefined> = function installVueMaplibreGl(app: App) {
	Object.entries(components).forEach(([ componentName, component ]) => {
		console.log('install', isComponent(component), componentName, component);
		if (isComponent(component)) {
			app.component(componentName, component);
		}
	});
};

// Create module definition for Vue.use()
export default install;

// To allow individual component use, export components
// each can be registered via Vue.component()
export * from '@/components/index';
export * from '@/components/types';
