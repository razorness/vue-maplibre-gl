import { defineComponent, onBeforeUnmount, PropType, Ref, unref, VNode } from 'vue';
import { AnySourceData, BackgroundLayer, Layer, Map, MapLayerEventType } from 'maplibre-gl';
import { ComponentInternalInstance } from '@vue/runtime-core';
import { SourceLayerRegistry } from '@/components/sources/sourceLayer.registry';

const sourceOpts: Array<keyof (Omit<BackgroundLayer, 'source-layer'> & { sourceLayer?: string })> = [
	'metadata', 'ref', 'source', 'sourceLayer', 'minzoom', 'maxzoom', 'interactive', 'filter', 'layout', 'paint'
];

const layerEvents: Array<keyof MapLayerEventType> = [
	'click', 'dblclick', 'mousedown', 'mouseup', 'mousemove', 'mouseenter', 'mouseleave', 'mouseover', 'mouseout', 'contextmenu', 'touchstart', 'touchend',
	'touchcancel'
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
	},
	emit : [
		'click', 'dblclick', 'mousedown', 'mouseup', 'mousemove', 'mouseenter', 'mouseleave', 'mouseover', 'mouseout', 'contextmenu', 'touchstart', 'touchend',
		'touchcancel'
	]
});

export function genLayerOpts<T extends Layer>(id: string, type: string, props: any, source: any): T {
	return Object.keys(props)
				 .filter(opt => (props as any)[ opt ] !== undefined && sourceOpts.indexOf(opt as any) !== -1)
				 .reduce((obj, opt) => {
					 (obj as any)[ opt === 'sourceLayer' ? 'source-layer' : opt ] = unref((props as any)[ opt ]);
					 return obj;
				 }, { type, source: props.source || source, id } as T);
}

export function registerLayerEvents(map: Map, layerId: string, vn: VNode) {
	if (!vn.props) {
		return;
	}
	for (let i = 0, len = layerEvents.length; i < len; i++) {
		const evProp = 'on' + layerEvents[ i ].charAt(0).toUpperCase() + layerEvents[ i ].substr(1);
		if (vn.props[ evProp ]) {
			map.on(layerEvents[ i ], layerId, vn.props[ evProp ]);
		}
	}
}

export function unregisterLayerEvents(map: Map, layerId: string, vn: VNode) {
	if (!vn.props) {
		return;
	}
	for (let i = 0, len = layerEvents.length; i < len; i++) {
		const evProp = 'on' + layerEvents[ i ].charAt(0).toUpperCase() + layerEvents[ i ].substr(1);
		if (vn.props[ evProp ]) {
			map.off(layerEvents[ i ], layerId, vn.props[ evProp ]);
		}
	}
}

export function handleDispose(isLoaded: Ref<boolean>, map: Ref<Map>, ci: ComponentInternalInstance, props: { layerId: string }, registry: SourceLayerRegistry) {
	function removeLayer() {
		if (isLoaded.value) {
			unregisterLayerEvents(map.value, props.layerId, ci.vnode);
			const layer = map.value.getLayer(props.layerId);
			if (layer) {
				map.value.removeLayer(props.layerId);
			}
		}
	}

	registry.registerUnmountHandler(props.layerId, removeLayer);
	onBeforeUnmount(() => {
		registry.unregisterUnmountHandler(props.layerId);
		removeLayer();
	});
}
