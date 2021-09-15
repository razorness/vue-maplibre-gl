export type SourceLayerRegistryHandler = () => void

export class SourceLayerRegistry {

	private unmountHandlers: SourceLayerRegistryHandler[] = [];

	addUnmountHandler(handler: SourceLayerRegistryHandler) {
		this.unmountHandlers.push(handler);
	}

	unmount() {
		for (let i = 0, len = this.unmountHandlers.length; i < len; i++) {
			this.unmountHandlers[ i ]();
		}
	}

}
