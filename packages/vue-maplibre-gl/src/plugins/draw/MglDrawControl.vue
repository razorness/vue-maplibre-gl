<template>
	<MglCustomControl :position="position">
		<!--
			The default buttons are only a convenience. The `buttons` slot hands out the current mode and
			the toggler, so a consumer can render its own UI without reimplementing the plugin wiring.
		-->
		<slot name="buttons" :mode="draw.mode" :set-mode="toggleMode">
			<MglButton
				v-for="button in buttons"
				:key="button.mode"
				:type="ButtonType.MDI"
				:path="button.path"
				:class="['maplibregl-ctrl-icon maplibregl-draw-control', button.class, draw.mode === button.mode ? 'is-active' : undefined]"
				@click="toggleMode(button.mode)"
			/>
		</slot>
	</MglCustomControl>
</template>

<script setup lang="ts">
import { inject, onBeforeUnmount, shallowReactive, watch, type PropType } from 'vue';
import { ButtonType } from 'components/buttonType';
import MglCustomControl from 'components/controls/MglCustomControl.vue';
import { Position, positionProp } from 'components/controls/position.enum';
import MglButton from 'components/MglButton.vue';
import { DrawMode, DrawPlugin, type DrawModel, type PointerPrecisionOption } from 'plugins/draw';
import { fitBoundsOptionsSymbol, isLoadedSymbol, mapSymbol } from 'types';

defineOptions({ name: 'MglDrawControl' });

const props = defineProps({
	position: positionProp(Position.TOP_RIGHT),
	model: Object as PropType<DrawModel>,
	mode: { type: String as unknown as () => DrawMode, default: DrawMode.POLYGON },
	defaultMode: { type: String as unknown as () => DrawMode, default: DrawMode.POLYGON },
	autoZoom: { type: Boolean, default: true },
	minAreaSize: Number,
	minAreaColor: String,
	minAreaLabel: String,
	pointerPrecision: Object as PropType<PointerPrecisionOption>
});

const emit = defineEmits<{
	'update:mode': [mode: DrawMode];
	'update:model': [model: DrawModel | undefined];
}>();

defineSlots<{
	/** Replaces the default mode buttons. */
	buttons?: (props: { mode: DrawMode; setMode: (mode: DrawMode) => void }) => unknown;
}>();

const map = inject(mapSymbol)!,
	isLoaded = inject(isLoadedSymbol)!,
	fitBoundsOptions = inject(fitBoundsOptionsSymbol);

/*
 * `shallowReactive`, not `reactive`: only `draw.mode` has to be reactive for the button states, and
 * `reactive()` would try to deeply unwrap the whole maplibre object graph — which blows past the
 * compiler's instantiation limit (TS2589) and, if annotated around, past what it will serialize into the
 * d.ts (TS7056), besides leaking the plugin's private fields (TS4094).
 */
const draw: DrawPlugin = shallowReactive(
	new DrawPlugin(map.value!, props.model, {
		mode: props.mode,
		autoZoom: props.autoZoom,
		pointerPrecision: props.pointerPrecision,
		minArea: { size: props.minAreaSize, color: props.minAreaColor, label: props.minAreaLabel },
		fitBoundsOptions,
		onUpdate: model => emit('update:model', model),
		waitForSetup: true
	})
);

/** The three built-in modes, so the template can `v-for` instead of repeating three `h()` calls. */
const buttons: Array<{ mode: DrawMode; class: string; path: string }> = [
	{
		mode: DrawMode.POLYGON,
		class: 'maplibregl-draw-control-polygon',
		path: 'M17,15.7V13H19V17L10,21L3,14L7,5H11V7H8.3L5.4,13.6L10.4,18.6L17,15.7M22,5V7H19V10H17V7H14V5H17V2H19V5H22Z'
	},
	{
		mode: DrawMode.CIRCLE,
		class: 'maplibregl-draw-control-circle',
		path: 'M11,19A6,6 0 0,0 17,13H19A8,8 0 0,1 11,21A8,8 0 0,1 3,13A8,8 0 0,1 11,5V7A6,6 0 0,0 5,13A6,6 0 0,0 11,19M19,5H22V7H19V10H17V7H14V5H17V2H19V5Z'
	},
	{
		mode: DrawMode.CIRCLE_STATIC,
		class: 'maplibregl-draw-control-circle-static',
		path: 'M3.05,13H1V11H3.05C3.5,6.83 6.83,3.5 11,3.05V1H13V3.05C17.17,3.5 20.5,6.83 20.95,11H23V13H20.95C20.5,17.17 17.17,20.5 13,20.95V23H11V20.95C6.83,20.5 3.5,17.17 3.05,13M12,5A7,7 0 0,0 5,12A7,7 0 0,0 12,19A7,7 0 0,0 19,12A7,7 0 0,0 12,5Z'
	}
];

/** Clicking the active mode again falls back to `defaultMode`. */
function toggleMode(m: DrawMode) {
	draw.setMode(draw.mode === m ? props.defaultMode : m, props.model);
	emit('update:mode', m);
}

watch(
	() => props.mode,
	() => props.mode !== draw.mode && toggleMode(props.mode)
);
watch(
	() => props.model,
	() => draw.setModel(props.model)
);
watch(
	() => props.autoZoom,
	() => draw.setAutoZoom(props.autoZoom)
);
watch(
	() => props.minAreaSize,
	() => draw.setMinAreaSize(props.minAreaSize)
);
watch(
	() => props.minAreaColor,
	() => draw.setMinAreaColor(props.minAreaColor)
);
watch(
	() => props.minAreaLabel,
	// was setMinAreaColor(props.minAreaLabel) — copy/paste, so the label never updated
	() => draw.setMinAreaLabel(props.minAreaLabel)
);
watch(isLoaded, () => isLoaded.value && draw.setup(), { immediate: true });

onBeforeUnmount(() => draw.dispose());

defineExpose({ draw });
</script>
