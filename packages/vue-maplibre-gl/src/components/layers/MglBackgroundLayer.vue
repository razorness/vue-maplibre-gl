<template>
	<MglLayer v-bind="$attrs" :layer-id="layerId!" type="background" :before="before" :options="options" />
</template>

<script setup lang="ts">
import type { BackgroundLayerSpecification } from 'maplibre-gl';
import { computed } from 'vue';
import MglLayer from 'components/MglLayer.vue';
import { LayerLib } from 'lib/layer.lib';

/**
 * Named shim over the generic `<MglLayer type="background">`.
 *
 * Kept so existing templates keep working: the props are the ones this component has always had. New
 * code should prefer `<MglLayer type="background" :options="…">`, or `useLayer()` for full control.
 *
 * `inheritAttrs: false` plus `v-bind="$attrs"` forwards the layer event listeners (`@click`, …) onto
 * `MglLayer`'s vnode, where `LayerLib` reads them — maplibre needs the `(event, layerId, handler)`
 * signature, which Vue's emit system cannot produce. Layer events are therefore deliberately **not**
 * declared here; declaring them would consume the listeners instead of passing them on.
 */
defineOptions({ name: 'MglBackgroundLayer', inheritAttrs: false });

const props = defineProps({
	...LayerLib.SHARED.props,
	/** maplibre `layout` properties for this background layer. Diffed per property, through `setLayoutProperty`. */
	layout: Object as () => BackgroundLayerSpecification['layout'],
	/** maplibre `paint` properties for this background layer. Diffed **per property**, so changing one does not restart the others' transitions. */
	paint: Object as () => BackgroundLayerSpecification['paint']
});

const options = computed(() => LayerLib.pickLayerOptions(props) as never);
</script>
