import { createCommentVNode, defineComponent, inject, PropType, provide, watch } from 'vue';
import { componentIdSymbol, sourceIdSymbol, sourceLayerRegistry } from '@/lib/types';
import { CanvasSource, CanvasSourceOptions } from 'maplibre-gl';
import { SourceLayerRegistry } from '@/lib/lib/sourceLayer.registry';
import { SourceLib } from '@/lib/lib/source.lib';
import { useSource } from '@/lib/composable/useSource';

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

		const cid      = inject(componentIdSymbol)!,
			  source   = SourceLib.getSourceRef<CanvasSource>(cid, props.sourceId),
			  registry = new SourceLayerRegistry();

		provide(sourceIdSymbol, props.sourceId);
		provide(sourceLayerRegistry, registry);

		useSource<CanvasSourceOptions>(source, props, 'canvas', sourceOpts, registry);

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
