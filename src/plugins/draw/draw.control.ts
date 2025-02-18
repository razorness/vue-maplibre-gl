import { MglButton, MglCustomControl } from '@/components';
import { ButtonType } from '@/components/button.component.ts';
import type { PositionProp } from '@/components/controls/position.enum.ts';
import { Position } from '@/components/controls/position.enum.ts';
import { DrawMode, type DrawModel, DrawPlugin, type PointerPrecisionOption } from '@/plugins/draw';
import { fitBoundsOptionsSymbol, isLoadedSymbol, mapSymbol } from '@/types.ts';
import { defineComponent, h, inject, onBeforeUnmount, type PropType, reactive, type SlotsType, watch } from 'vue';

export default /*#__PURE__*/ defineComponent({
	name      : 'MglDrawControl',
	components: { MglCustomControl },
	props     : {
		position        : { type: String as PropType<PositionProp>, default: Position.TOP_RIGHT },
		model           : { type: Object as PropType<DrawModel> },
		mode            : { type: String as PropType<DrawMode | 'POLYGON' | 'CIRCLE' | 'CIRCLE_STATIC'>, default: DrawMode.POLYGON },
		defaultMode     : { type: String as PropType<DrawMode | 'POLYGON' | 'CIRCLE' | 'CIRCLE_STATIC'>, default: DrawMode.POLYGON },
		autoZoom        : { type: Boolean, default: true },
		minAreaSize     : { type: Number },
		minAreaColor    : { type: String },
		minAreaLabel    : { type: String },
		pointerPrecision: { type: Object as PropType<PointerPrecisionOption> }
	},
	emits     : [ 'update:mode', 'update:model' ],
	slots     : Object as SlotsType<{
		buttons: { mode: DrawMode, setMode: (mode: DrawMode) => void },
	}>,
	setup(props, { emit, slots }) {

		const map              = inject(mapSymbol)!,
			  isLoaded         = inject(isLoadedSymbol)!,
			  fitBoundsOptions = inject(fitBoundsOptionsSymbol);

		const draw = reactive(new DrawPlugin(map.value!, props.model, {
			mode            : props.mode as DrawMode,
			autoZoom        : props.autoZoom,
			pointerPrecision: props.pointerPrecision,
			minArea         : {
				size : props.minAreaSize,
				color: props.minAreaColor,
				label: props.minAreaLabel,
			},
			fitBoundsOptions: fitBoundsOptions,
			onUpdate        : (model) => emit('update:model', model),
			waitForSetup    : true
		}));

		function toggleMode(m: DrawMode) {
			if (draw.mode === m) {
				draw.setMode(props.defaultMode as DrawMode, props.model);
			} else {
				draw.setMode(m, props.model);
			}
			emit('update:mode', m);
		}

		watch(() => props.mode, () => props.mode !== draw.mode && toggleMode(props.mode as DrawMode));
		watch(() => props.model, () => draw.setModel(props.model));
		watch(() => props.autoZoom, () => draw.setAutoZoom(props.autoZoom));
		watch(() => props.minAreaSize, () => draw.setMinAreaSize(props.minAreaSize));
		watch(() => props.minAreaColor, () => draw.setMinAreaColor(props.minAreaColor));
		watch(() => props.minAreaLabel, () => draw.setMinAreaColor(props.minAreaLabel));
		watch(isLoaded, () => isLoaded.value && draw.setup(), { immediate: true });

		onBeforeUnmount(() => draw.dispose());

		return () => h(
			MglCustomControl,
			{ position: props.position },
			() =>
				slots.buttons
					? slots.buttons({ mode: draw.mode, setMode: toggleMode })
					: [
						h(MglButton, {
							type   : ButtonType.MDI,
							path   : 'M17,15.7V13H19V17L10,21L3,14L7,5H11V7H8.3L5.4,13.6L10.4,18.6L17,15.7M22,5V7H19V10H17V7H14V5H17V2H19V5H22Z',
							'class': [ 'maplibregl-ctrl-icon maplibregl-draw-control maplibregl-draw-control-polygon', draw.mode === DrawMode.POLYGON ? 'is-active' : undefined ],
							onClick: () => toggleMode(DrawMode.POLYGON)
						}),
						h(MglButton, {
							type   : ButtonType.MDI,
							path   : 'M11,19A6,6 0 0,0 17,13H19A8,8 0 0,1 11,21A8,8 0 0,1 3,13A8,8 0 0,1 11,5V7A6,6 0 0,0 5,13A6,6 0 0,0 11,19M19,5H22V7H19V10H17V7H14V5H17V2H19V5Z',
							'class': [ 'maplibregl-ctrl-icon maplibregl-draw-control maplibregl-draw-control-circle', draw.mode === DrawMode.CIRCLE ? 'is-active' : undefined ],
							onClick: () => toggleMode(DrawMode.CIRCLE)
						}),
						h(MglButton, {
							type   : ButtonType.MDI,
							path   : 'M3.05,13H1V11H3.05C3.5,6.83 6.83,3.5 11,3.05V1H13V3.05C17.17,3.5 20.5,6.83 20.95,11H23V13H20.95C20.5,17.17 17.17,20.5 13,20.95V23H11V20.95C6.83,20.5 3.5,17.17 3.05,13M12,5A7,7 0 0,0 5,12A7,7 0 0,0 12,19A7,7 0 0,0 19,12A7,7 0 0,0 12,5Z',
							'class': [ 'maplibregl-ctrl-icon maplibregl-draw-control maplibregl-draw-control-circle-static', draw.mode === DrawMode.CIRCLE_STATIC ? 'is-active' : undefined ],
							onClick: () => toggleMode(DrawMode.CIRCLE_STATIC)
						}),
					]
		);

	}
});
