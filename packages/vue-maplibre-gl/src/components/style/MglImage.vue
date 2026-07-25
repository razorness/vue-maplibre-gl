<template>
	<!-- style-level setting: no DOM -->
</template>

<script setup lang="ts">
import type { Map as MaplibreMap, StyleImageInterface } from 'maplibre-gl';
import { computed, type PropType } from 'vue';
import { useStyleSetting } from 'composable/useStyleSetting';

defineOptions({ name: 'MglImage' });

/** Whatever maplibre's addImage accepts, taken from its own signature rather than re-listed. */
type AddImageSource = Parameters<MaplibreMap['addImage']>[1];

const props = defineProps({
	/** Name layers reference in `icon-image` / `fill-pattern` / `line-pattern`. */
	id: { type: String as PropType<string>, required: true },
	/** Bitmap, `ImageData`, `ImageBitmap`, or a `StyleImageInterface` for a procedural icon. */
	image: { type: [Object, null] as unknown as PropType<AddImageSource | StyleImageInterface>, required: true },
	pixelRatio: Number as PropType<number>,
	sdf: Boolean as PropType<boolean>
});

useStyleSetting({
	value: computed(() => ({ image: props.image, pixelRatio: props.pixelRatio, sdf: props.sdf })),
	apply: (map, { image, pixelRatio, sdf }) => {
		/* addImage throws on a duplicate id, and a style switch wipes the registry, so branch on presence */
		if (map.hasImage(props.id)) {
			map.updateImage(props.id, image as never);
		} else {
			map.addImage(props.id, image as never, { pixelRatio, sdf });
		}
	},
	reset: map => map.hasImage(props.id) && map.removeImage(props.id)
});
</script>
