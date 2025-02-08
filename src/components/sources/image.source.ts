import { useSource } from '@/composable/useSource';
import { AllSourceOptions } from '@/types';
import type { Coordinates, ImageSource, ImageSourceSpecification } from 'maplibre-gl';
import { createCommentVNode, defineComponent, isRef, type PropType, type SlotsType, watch } from 'vue';

const sourceOpts = AllSourceOptions<ImageSourceSpecification>({
	url        : undefined,
	coordinates: undefined,
});

export default /*#__PURE__*/ defineComponent({
	name : 'MglImageSource',
	props: {
		sourceId   : {
			type    : String as PropType<string>,
			required: true
		},
		url        : String as PropType<ImageSourceSpecification['url']>,
		coordinates: Array as unknown as PropType<ImageSourceSpecification['coordinates']>
	},
	slots: Object as SlotsType<{ default: {} }>,
	setup(props, { slots }) {

		const source = useSource<ImageSource, ImageSourceSpecification>(props, 'image', sourceOpts);

		watch(isRef(props.coordinates) ? props.coordinates : () => props.coordinates, v => {
			source.value?.setCoordinates(v as Coordinates);
		}, { immediate: true });

		return () => [
			createCommentVNode('Image Source'),
			source.value && slots.default ? slots.default({}) : undefined
		];

	}
});
