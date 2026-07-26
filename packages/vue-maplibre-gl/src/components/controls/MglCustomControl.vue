<template>
	<!--
		The container only exists once maplibre has added the control, so the Teleport target is not
		available on the first render.
	-->
	<Teleport v-if="isAdded" :to="control.container">
		<slot />
	</Teleport>
</template>

<script setup lang="ts">
import { inject, ref, watch } from 'vue';
import { CustomControl } from 'components/controls/customControl';
import { positionProp } from 'components/controls/position.enum';
import { usePositionWatcher } from 'composable/usePositionWatcher';
import { mapSymbol } from 'types';

defineOptions({ name: 'MglCustomControl' });

const props = defineProps({
	/** Corner of the map the control is placed in. Adding, moving and removing is owned centrally, not by the component. */
	position: positionProp(),
	/** Skip maplibre's control classes, so the slot content is styled entirely by you. */
	noClasses: { type: Boolean, default: false }
});

defineSlots<{ default?: () => unknown }>();

const map = inject(mapSymbol)!,
	isAdded = ref(false),
	control = new CustomControl(isAdded, props.noClasses);

usePositionWatcher(() => props.position, map, control);

watch(
	() => props.noClasses,
	v => control.setClasses(v)
);

defineExpose({ control });
</script>
