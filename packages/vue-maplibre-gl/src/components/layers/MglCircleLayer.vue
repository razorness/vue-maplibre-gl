<template>
	<MglLayer v-bind="$attrs" :layer-id="layerId!" type="circle" :source="source" :before="before" :options="options" />
</template>

<script setup lang="ts">
import type { CircleLayerSpecification } from 'maplibre-gl';
import { computed } from 'vue';
import MglLayer from 'components/MglLayer.vue';
import { LayerLib } from 'lib/layer.lib';

defineOptions({ name: 'MglCircleLayer', inheritAttrs: false });

const props = defineProps({
	...LayerLib.SHARED.props,
	/** maplibre `layout` properties for this circle layer. Diffed per property, through `setLayoutProperty`. */
	layout: Object as () => CircleLayerSpecification['layout'],
	/** maplibre `paint` properties for this circle layer. Diffed **per property**, so changing one does not restart the others' transitions. */
	paint: Object as () => CircleLayerSpecification['paint'],
	/** Expression deciding which features of the source this layer draws. Applied through `setFilter`. */
	filter: [Boolean, Array] as unknown as () => CircleLayerSpecification['filter']
});

const options = computed(() => LayerLib.pickLayerOptions(props) as never);
</script>
