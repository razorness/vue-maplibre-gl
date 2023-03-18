import { createCommentVNode, defineComponent, inject, PropType, provide, toRef, watch } from 'vue';
import { componentIdSymbol, sourceIdSymbol, sourceLayerRegistry } from '@/lib/types';
import { CanvasSource, CanvasSourceSpecification, Coordinates } from 'maplibre-gl';
import { SourceLayerRegistry } from '@/lib/lib/sourceLayer.registry';
import { SourceLib } from '@/lib/lib/source.lib';
import { useSource } from '@/lib/composable/useSource';

const sourceOpts: Array<keyof CanvasSourceSpecification> = [ 'animate', 'coordinates', 'canvas' ];

export default defineComponent({
	name : 'MglCanvasSource',
	props: {
		sourceId   : {
			type    : String as PropType<string>,
			required: true
		},
		coordinates: Array as unknown as PropType<Coordinates>,
		animate    : Boolean as PropType<boolean>,
		canvas     : [ HTMLCanvasElement, String ] as PropType<HTMLCanvasElement | string>
	},
	setup(props) {

		const cid      = inject(componentIdSymbol)!,
			  source   = SourceLib.getSourceRef<CanvasSource>(cid, props.sourceId),
			  registry = new SourceLayerRegistry();

		provide(sourceIdSymbol, props.sourceId);
		provide(sourceLayerRegistry, registry);

		useSource<CanvasSourceSpecification>(source, props, 'canvas', sourceOpts, registry);

		watch(toRef(props, 'coordinates'), v => {
			if (v) {
				source.value?.setCoordinates(v);
			}
		});

		return { source };

	},
	render() {
		return [
			createCommentVNode('Canvas Source'),
			this.source && this.$slots.default ? this.$slots.default() : undefined
		];
	}
});
