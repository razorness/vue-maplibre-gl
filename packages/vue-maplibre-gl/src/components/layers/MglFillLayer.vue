<template>
	<MglLayer v-bind="$attrs" :layer-id="layerId!" type="fill" :source="source" :before="before" :options="options" />
</template>

<script setup lang="ts">
import type { FillLayerSpecification } from 'maplibre-gl';
import { computed } from 'vue';
import MglLayer from 'components/MglLayer.vue';
import { LayerLib } from 'lib/layer.lib';

/**
 * Named shim over the generic `<MglLayer type="fill">`.
 *
 * Kept so existing templates keep working: the props are the ones this component has always had. New
 * code should prefer `<MglLayer type="fill" :options="…">`, or `useLayer()` for full control.
 *
 * `inheritAttrs: false` plus `v-bind="$attrs"` forwards the layer event listeners (`@click`, …) onto
 * `MglLayer`'s vnode, where `LayerLib` reads them — maplibre needs the `(event, layerId, handler)`
 * signature, which Vue's emit system cannot produce. Layer events are therefore deliberately **not**
 * declared here; declaring them would consume the listeners instead of passing them on.
 */
defineOptions({ name: 'MglFillLayer', inheritAttrs: false });

const props = defineProps({
	...LayerLib.SHARED.props,
	/** maplibre `layout` properties for this fill layer. Diffed per property, through `setLayoutProperty`. */
	layout: Object as () => FillLayerSpecification['layout'],
	/** maplibre `paint` properties for this fill layer. Diffed **per property**, so changing one does not restart the others' transitions. */
	paint: Object as () => FillLayerSpecification['paint'],
	/** Expression deciding which features of the source this layer draws. Applied through `setFilter`. */
	filter: [Boolean, Array] as unknown as () => FillLayerSpecification['filter']
});

const options = computed(() => LayerLib.pickLayerOptions(props) as never);
</script>
