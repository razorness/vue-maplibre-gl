<template>
	<!-- wraps a native maplibre control: no DOM of its own -->
</template>

<script setup lang="ts">
import { LogoControl } from 'maplibre-gl';
import { inject, type PropType } from 'vue';
import { Position, positionProp } from 'components/controls/position.enum';
import { usePositionWatcher } from 'composable/usePositionWatcher';
import { mapSymbol } from 'types';

/**
 * The maplibre wordmark.
 *
 * Only needed when the map was created with `maplibreLogo: false` and you want to place it yourself;
 * otherwise maplibre adds it on its own.
 */
defineOptions({ name: 'MglLogoControl' });

const props = defineProps({
	position: positionProp(Position.BOTTOM_LEFT),
	compact: Boolean as PropType<boolean>
});

const map = inject(mapSymbol)!,
	control = new LogoControl({ compact: props.compact });

usePositionWatcher(() => props.position, map, control);
</script>
