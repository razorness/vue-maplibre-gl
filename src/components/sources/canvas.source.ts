import { useSource } from '@/composable/useSource';
import { AllSourceOptions } from '@/types';
import type { CanvasSource, CanvasSourceSpecification, Coordinates } from 'maplibre-gl';
import { createCommentVNode, defineComponent, isRef, type PropType, type SlotsType, watch } from 'vue';

const sourceOpts = AllSourceOptions<CanvasSourceSpecification>({
	animate    : undefined,
	canvas     : undefined,
	coordinates: undefined,
});

export default /*#__PURE__*/ defineComponent({
	name : 'MglCanvasSource',
	props: {
		sourceId   : {
			type    : String as PropType<string>,
			required: true
		},
		coordinates: Array as unknown as PropType<CanvasSourceSpecification['coordinates']>,
		animate    : Boolean as PropType<CanvasSourceSpecification['animate']>,
		canvas     : [ Object, String ] as PropType<CanvasSourceSpecification['canvas']>
	},
	slots: Object as SlotsType<{ default: {} }>,
	setup(props, { slots }) {

		const source = useSource<CanvasSource, CanvasSourceSpecification>(props, 'canvas', sourceOpts);

		watch(isRef(props.coordinates) ? props.coordinates : () => props.coordinates, v => {
			source.value?.setCoordinates(v as Coordinates);
		}, { immediate: true });

		return () => [
			createCommentVNode('Canvas Source'),
			source.value && slots.default ? slots.default({}) : undefined
		];

	}
});
