<template>
	<!-- the container only exists once maplibre has added the control -->
	<Teleport v-if="isAdded" :to="control.container">
		<!--
			Three nested slots, all receiving the same props: `default` replaces the whole control,
			`button` only the toggle, `styleList` only the list. The dummy `template` string the previous
			implementation carried purely so IDEs would offer these slots is no longer needed — in an SFC
			the template *is* the source of truth.
		-->
		<slot v-bind="slotProps">
			<slot name="button" v-bind="slotProps">
				<MglButton
					:type="ButtonType.MDI"
					path="M12,18.54L19.37,12.8L21,14.07L12,21.07L3,14.07L4.62,12.81L12,18.54M12,16L3,9L12,2L21,9L12,16M12,4.53L6.26,9L12,13.47L17.74,9L12,4.53Z"
					:class="['maplibregl-ctrl-icon maplibregl-style-switch', isOpen ? 'is-open' : '']"
					@click="toggleOpen(true, $event)"
				/>
			</slot>
			<slot name="styleList" v-bind="slotProps">
				<div :class="['maplibregl-style-list', isOpen ? 'is-open' : '']">
					<template v-for="style in mapStyles" :key="style.name">
						<MglButton
							v-if="style.icon"
							:type="ButtonType.MDI"
							:path="style.icon.path"
							:class="currentStyle?.name === style.name ? 'is-active' : ''"
							@click="setStyle(style)"
						>
							{{ style.label }}
						</MglButton>
						<button v-else type="button" :class="currentStyle?.name === style.name ? 'is-active' : ''" @click="setStyle(style)">
							{{ style.label }}
						</button>
					</template>
				</div>
			</slot>
		</slot>
	</Teleport>
</template>

<script setup lang="ts">
import { computed, inject, onBeforeUnmount, ref, shallowRef, watch, type PropType } from 'vue';
import { ButtonType } from 'components/buttonType';
import { CustomControl } from 'components/controls/customControl';
import { positionProp } from 'components/controls/position.enum';
import MglButton from 'components/MglButton.vue';
import { usePositionWatcher } from 'composable/usePositionWatcher';
import { emitterSymbol, isInitializedSymbol, isLoadedSymbol, mapSymbol, type StyleSwitchItem } from 'types';

defineOptions({ name: 'MglStyleSwitchControl' });

const props = defineProps({
	position: positionProp(),
	mapStyles: { type: Array as PropType<StyleSwitchItem[]>, default: () => [] },
	modelValue: Object as PropType<StyleSwitchItem>,
	isOpen: { type: Boolean, default: undefined }
});

const emit = defineEmits<{
	'update:modelValue': [style: StyleSwitchItem];
	'update:isOpen': [isOpen: boolean];
}>();

export interface StyleSwitchSlotProps {
	isOpen: boolean;
	toggleOpen: (forceIsOpen?: boolean, e?: Event) => void;
	setStyle: (s: StyleSwitchItem) => void;
	mapStyles: StyleSwitchItem[];
	currentStyle: StyleSwitchItem | undefined;
}

defineSlots<{
	default?: (props: StyleSwitchSlotProps) => unknown;
	button?: (props: StyleSwitchSlotProps) => unknown;
	styleList?: (props: StyleSwitchSlotProps) => unknown;
}>();

const map = inject(mapSymbol)!,
	isInitialized = inject(isInitializedSymbol)!,
	isMapLoaded = inject(isLoadedSymbol)!,
	emitter = inject(emitterSymbol)!,
	isAdded = ref(false),
	control = new CustomControl(isAdded, false);

/* uncontrolled fallbacks: used only while the matching prop is left undefined */
const internalIsOpen = ref(props.isOpen ?? false),
	internalStyle = shallowRef<StyleSwitchItem | undefined>(props.modelValue ?? props.mapStyles[0]);

const isOpen = computed(() => props.isOpen ?? internalIsOpen.value),
	currentStyle = computed(() => (props.modelValue === undefined ? internalStyle.value : props.modelValue));

const slotProps = computed<StyleSwitchSlotProps>(() => ({
	isOpen: isOpen.value,
	toggleOpen,
	setStyle,
	mapStyles: props.mapStyles,
	currentStyle: currentStyle.value
}));

function setStyle(s: StyleSwitchItem) {
	if (currentStyle.value?.name === s.name) {
		return;
	}
	/* sources reset their handles on this, before setStyle throws them away */
	emitter.emit('styleSwitched', s);

	/*
	 * Skip diff as long as maplibre-gl does not fire `style.load` reliably with diffing on.
	 * @see https://github.com/maplibre/maplibre-gl-js/issues/2587
	 */
	map.value!.setStyle(s.style, { diff: false });
	internalStyle.value = s;
	emit('update:modelValue', s);
	toggleOpen(false);
}

function toggleOpen(forceIsOpen?: boolean, e?: Event) {
	/* the document-level closer must not see the click that opened the control */
	e?.stopPropagation();
	const next = typeof forceIsOpen === 'boolean' ? forceIsOpen : !isOpen.value;
	if (next === isOpen.value) {
		return;
	}
	internalIsOpen.value = next;
	emit('update:isOpen', next);
}

/** Picks up a style set on the map from elsewhere, so the control reflects reality. */
function setStyleByMap() {
	const name = map.value!.getStyle().name,
		match = props.mapStyles.find(style => style.name === name);
	if (match) {
		setStyle(match);
	}
}

const closer = () => toggleOpen(false);

watch(isMapLoaded, v => v && setStyleByMap(), { immediate: true });
map.value!.on('style.load', setStyleByMap);
document.addEventListener('click', closer);

usePositionWatcher(() => props.position, map, control);

// removeControl is owned by usePositionWatcher
onBeforeUnmount(() => {
	if (isInitialized.value) {
		map.value!.off('style.load', setStyleByMap);
	}
	document.removeEventListener('click', closer);
});
</script>
