<template>
	<MglLayer v-bind="$attrs" :layer-id="layerId!" type="line" :source="source" :before="before" :options="options" />
</template>

<script setup lang="ts">
import type { LineLayerSpecification } from 'maplibre-gl';
import { computed } from 'vue';
import MglLayer from 'components/MglLayer.vue';
import { LayerLib } from 'lib/layer.lib';

/**
 * Named shim over the generic `<MglLayer type="line">`.
 *
 * Kept so existing templates keep working: the props are the ones this component has always had. New
 * code should prefer `<MglLayer type="line" :options="…">`, or `useLayer()` for full control.
 *
 * `inheritAttrs: false` plus `v-bind="$attrs"` forwards the layer event listeners (`@click`, …) onto
 * `MglLayer`'s vnode, where `LayerLib` reads them — maplibre needs the `(event, layerId, handler)`
 * signature, which Vue's emit system cannot produce. Layer events are therefore deliberately **not**
 * declared here; declaring them would consume the listeners instead of passing them on.
 */
defineOptions({ name: 'MglLineLayer', inheritAttrs: false });

const props = defineProps({
	...LayerLib.SHARED.props,
	layout: Object as () => LineLayerSpecification['layout'],
	paint: Object as () => LineLayerSpecification['paint'],
	filter: [Boolean, Array] as unknown as () => LineLayerSpecification['filter']
});

const options = computed(() => LayerLib.pickLayerOptions(props) as never);
</script>
