import { defineComponent, PropType, unref } from 'vue';
import { AnySourceData, BackgroundLayer, Layer } from 'maplibre-gl';

const sourceOpts: Array<keyof (Omit<BackgroundLayer, 'source-layer'> & { sourceLayer?: string })> = [
	'metadata', 'ref', 'source', 'sourceLayer', 'minzoom', 'maxzoom', 'interactive', 'filter', 'layout', 'paint'
];

export const Shared = defineComponent({
	props: {
		layerId    : {
			type    : String as PropType<string>,
			required: true
		},
		source     : [ String, Object ] as PropType<string | AnySourceData>,
		metadata   : [ Object, Array, String, Number ] as PropType<any>,
		ref        : String as PropType<string>,
		sourceLayer: String as PropType<string>,
		minzoom    : Number as PropType<number>,
		maxzoom    : Number as PropType<number>,
		interactive: Boolean as PropType<boolean>,
		filter     : Array as PropType<any[ ]>,
		before     : String as PropType<string>
	}
});

export function genLayerOpts<T extends Layer>(id: string, type: string, props: any, source: any): T {
	return Object.keys(props)
				 .filter(opt => (props as any)[ opt ] !== undefined && sourceOpts.indexOf(opt as any) !== -1)
				 .reduce((obj, opt) => {
					 (obj as any)[ opt === 'sourceLayer' ? 'source-layer' : opt ] = unref((props as any)[ opt ]);
					 return obj;
				 }, { type, source: props.source || source, id } as T);
}
