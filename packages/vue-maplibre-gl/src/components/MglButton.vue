<template>
	<button v-if="type === ButtonType.TEXT" type="button">
		<slot />
	</button>
	<button v-else type="button" class="maplibregl-ctrl-icon">
		<svg :width="size ?? iconDefaults?.size" :height="size ?? iconDefaults?.size" :viewBox="viewbox ?? iconDefaults?.viewbox">
			<path fill="currentColor" :d="path" />
		</svg>
		<slot />
	</button>
</template>

<script setup lang="ts">
import { computed, warn, type PropType } from 'vue';
import { BUTTON_ICON_DEFAULTS, ButtonType, ButtonTypeValues } from 'components/buttonType';

defineOptions({ name: 'MglButton' });

const props = defineProps({
	/** Icon convention to size the SVG by, or `text` for a label-only button. */
	type: {
		type: String as unknown as () => ButtonType,
		default: ButtonType.DEFAULT,
		validator: (v: unknown) => ButtonTypeValues.includes(v as ButtonType)
	},
	/** SVG path data for the icon. Required for every type except `text`. */
	path: String as PropType<string>,
	/** Icon size in pixels. Defaults to what the `type` implies. */
	size: Number as PropType<number>,
	/** SVG viewBox. Defaults to what the `type` implies. */
	viewbox: String as PropType<string>
});

defineSlots<{
	/** Button label, or extra content next to the icon. */
	default?: () => unknown;
}>();

if (!props.path && props.type !== ButtonType.TEXT) {
	warn('property `path` must be set on MglButton');
}

/* was a ref kept in sync by a watcher; a computed cannot go stale */
const iconDefaults = computed(() => BUTTON_ICON_DEFAULTS[props.type] ?? BUTTON_ICON_DEFAULTS.default);
</script>
