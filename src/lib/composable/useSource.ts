import { inject, onBeforeUnmount, Ref, watch } from 'vue';
import { AnySourceData, AnySourceImpl } from 'maplibre-gl';
import { emitterSymbol, isLoadedSymbol, mapSymbol } from '@/lib/types';
import { SourceLayerRegistry } from '@/lib/lib/sourceLayer.registry';
import { SourceLib } from '@/lib/lib/source.lib';

export function useSource<O extends object>(
	source: Ref<AnySourceImpl | undefined | null>,
	props: any,
	type: string,
	sourceOpts: Array<keyof O>,
	registry: SourceLayerRegistry
) {

	const map      = inject(mapSymbol)!,
		  isLoaded = inject(isLoadedSymbol)!,
		  emitter  = inject(emitterSymbol)!;

	function addSource() {
		if (isLoaded.value) {
			map.value.addSource(props.sourceId, SourceLib.genSourceOpts<object, O>(type, props, sourceOpts) as AnySourceData);
			source.value = map.value.getSource(props.sourceId);
		}
	}

	function resetSource() {
		source.value = null;
	}

	watch(isLoaded, addSource, { immediate: true });
	map.value.on('style.load', addSource);
	emitter.on('styleSwitched', resetSource);

	return onBeforeUnmount(() => {
		if (isLoaded.value) {
			registry.unmount();
			map.value.removeSource(props.sourceId);
		}
		map.value.off('style.load', addSource);
		emitter.off('styleSwitched', resetSource);
	});

}
