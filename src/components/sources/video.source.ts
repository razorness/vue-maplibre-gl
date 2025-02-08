import { useSource } from '@/composable/useSource';
import { AllSourceOptions } from '@/types';
import type { Coordinates, VideoSource, VideoSourceSpecification } from 'maplibre-gl';
import { createCommentVNode, defineComponent, isRef, type PropType, type SlotsType, watch } from 'vue';

const sourceOpts = AllSourceOptions<VideoSourceSpecification>({
	urls       : undefined,
	coordinates: undefined,
});

export default /*#__PURE__*/ defineComponent({
	name : 'MglVideoSource',
	props: {
		sourceId   : {
			type    : String as PropType<string>,
			required: true
		},
		urls       : Array as PropType<VideoSourceSpecification['urls']>,
		coordinates: Array as unknown as PropType<VideoSourceSpecification['coordinates']>
	},
	slots: Object as SlotsType<{ default: {} }>,
	setup(props, { slots }) {

		const source = useSource<VideoSource, VideoSourceSpecification>(props, 'video', sourceOpts);

		watch(isRef(props.coordinates) ? props.coordinates : () => props.coordinates, v => {
			source.value?.setCoordinates(v as Coordinates);
		}, { immediate: true });

		return () => [
			createCommentVNode('Video Source'),
			source.value && slots.default ? slots.default({}) : undefined
		];

	}
});
