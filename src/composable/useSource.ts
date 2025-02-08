import { SourceLib } from '@/lib/source.lib';
import { SourceLayerRegistry } from '@/lib/sourceLayer.registry';
import { componentIdSymbol, emitterSymbol, isLoadedSymbol, mapSymbol, sourceIdSymbol, sourceLayerRegistry } from '@/types';
import type { Source, SourceSpecification } from 'maplibre-gl';
import { inject, onBeforeUnmount, provide, type Ref, watch } from 'vue';

export function useSource<T extends Source, O extends object>(
	props: any,
	type: string,
	sourceOpts: Array<keyof O>,
): Ref<T | null | undefined> {

	const map      = inject(mapSymbol)!,
		  isLoaded = inject(isLoadedSymbol)!,
		  emitter  = inject(emitterSymbol)!;

	const cid      = inject(componentIdSymbol)!,
		  source   = SourceLib.getSourceRef<T>(cid, props.sourceId),
		  registry = new SourceLayerRegistry();

	provide(sourceIdSymbol, props.sourceId);
	provide(sourceLayerRegistry, registry);


	function addSource() {
		if (isLoaded.value) {
			map.value!.addSource(props.sourceId, SourceLib.genSourceOpts<object, O>(type, props, sourceOpts) as SourceSpecification);
			source.value = map.value!.getSource(props.sourceId) as T;
		}
	}

	function resetSource() {
		source.value = null;
	}

	watch(isLoaded, addSource, { immediate: true });
	map.value!.on('style.load', addSource);
	emitter.on('styleSwitched', resetSource);

	onBeforeUnmount(() => {
		if (isLoaded.value) {
			registry.unmount();
			map.value!.removeSource(props.sourceId);
		}
		map.value!.off('style.load', addSource);
		emitter.off('styleSwitched', resetSource);
	});

	return source;

}
