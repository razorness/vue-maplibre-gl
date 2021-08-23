import { defineComponent, h, PropType, ref, warn, watch } from 'vue';

export enum ButtonType {
	DEFAULT     = 'default',
	TEXT        = 'text',
	MDI         = 'mdi',
	SIMPLE_ICON = 'simple-icons',
}

export type ButtonTypeValue = keyof Record<ButtonType, any>;
export const ButtonTypeValues = Object.values(ButtonType);

interface Default {
	size: number;
	viewbox: string;
}

const types: Record<ButtonType, Default | undefined> = {
	[ ButtonType.TEXT ]       : undefined,
	[ ButtonType.MDI ]        : {
		size   : 21,
		viewbox: '0 0 24 24'
	},
	[ ButtonType.SIMPLE_ICON ]: {
		size   : 21,
		viewbox: '0 0 24 24'
	},
	[ ButtonType.DEFAULT ]    : {
		size   : 0,
		viewbox: '0 0 0 0'
	}
};


export default defineComponent({
	name : 'MglButton',
	props: {
		type   : {
			type     : String as PropType<ButtonTypeValue>,
			default  : ButtonType.DEFAULT,
			validator: (v: ButtonType) => {
				return ButtonTypeValues.indexOf(v) !== -1;
			}
		},
		path   : {
			type: String as PropType<string>
		},
		size   : Number as PropType<number>,
		viewbox: String as PropType<string>
	},
	setup(props) {

		if (!props.path && props.type !== ButtonType.TEXT) {
			warn('property `path` must be set on MaplibreButton');
		}

		const defaults = ref(types[ props.type ] || types.default);
		watch(() => props.type, v => defaults.value = types[ v ] || types.default);

		return { defaults };

	},
	render() {
		if (this.type === ButtonType.TEXT) {
			return h('button', { type: 'button' }, this.$slots.default ? this.$slots.default() : undefined);
		}
		return h('button', { type: 'button', 'class': 'maplibregl-ctrl-icon' },
			[
				h(
					'svg',
					{
						width  : this.size || this.defaults!.size,
						height : this.size || this.defaults!.size,
						viewBox: this.viewbox || this.defaults!.viewbox
					},
					h('path', { fill: 'currentColor', d: this.path })
				),
				this.$slots.default ? this.$slots.default() : undefined
			]
		);
	}
});
