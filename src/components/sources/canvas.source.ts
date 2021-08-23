import { createCommentVNode, defineComponent, inject, PropType, provide, watch } from 'vue';
import { componentIdSymbol, emitterSymbol, isLoadedSymbol, mapSymbol, sourceIdSymbol } from '@/components/types';
import { CanvasSource, CanvasSourceOptions } from 'maplibre-gl';
import { bindSource, getSourceRef } from '@/components/sources/shared';

const sourceOpts: Array<keyof CanvasSourceOptions> = [ 'animate', 'coordinates', 'canvas' ];

export default defineComponent({
	name : 'MglCanvasSource',
	props: {
		sourceId   : {
			type    : String as PropType<string>,
			required: true
		},
		coordinates: Array as PropType<number[][]>,
		animate    : Boolean as PropType<boolean>,
		canvas     : [ HTMLCanvasElement, String ] as PropType<HTMLCanvasElement | string>
	},
	setup(props) {

		const map      = inject(mapSymbol)!,
			  isLoaded = inject(isLoadedSymbol)!,
			  emitter  = inject(emitterSymbol)!,
			  cid      = inject(componentIdSymbol)!,
			  source   = getSourceRef<CanvasSource>(cid, props.sourceId);

		provide(sourceIdSymbol, props.sourceId);

		bindSource(map, source, isLoaded, emitter, props, 'canvas', sourceOpts);
		watch(() => props.coordinates, v => source.value?.setCoordinates(v || []));

		return { source };
	},
	render() {
		return [
			createCommentVNode('Canvas Source'),
			this.source && this.$slots.default ? this.$slots.default() : undefined
		];

	}
});
