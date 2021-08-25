import { defineComponent, inject, onBeforeUnmount, PropType, unref, watch } from 'vue';
import { Alignment, Anchor, LngLatLike, Marker, MarkerOptions, PointLike } from 'maplibre-gl';
import { MapLib } from '@/components/map.lib';
import { mapSymbol } from '@/components/types';

export default defineComponent({
	name : 'MglMarker',
	props: {
		coordinates: {
			type    : [ Object, Array ] as unknown as PropType<LngLatLike>,
			required: true
		},
		offset     : [ Object, Array ] as PropType<PointLike>,
		anchor     : String as PropType<Anchor>,
		color      : String as PropType<string>,
		// draggable        : Boolean as PropType<boolean>, todo implement feature
		clickTolerance   : Number as PropType<number>,
		rotation         : Number as PropType<number>,
		rotationAlignment: String as PropType<Alignment>,
		pitchAlignment   : String as PropType<Alignment>,
		scale            : Number as PropType<number>
	},
	setup(props) {
		const map                 = inject(mapSymbol)!,
			  opts: MarkerOptions = Object.keys(props)
										  .filter(opt => (props as any)[ opt ] !== undefined && MapLib.MARKER_OPTION_KEYS.indexOf(opt as keyof MarkerOptions) !== -1)
										  .reduce((obj, opt) => {
											  (obj as any)[ opt ] = unref((props as any)[ opt ]);
											  return obj;
										  }, {});

		const marker = new Marker(opts);
		marker.setLngLat(props.coordinates).addTo(map.value);

		watch(() => props.coordinates, v => marker.setLngLat(v));
		// watch(() => props.draggable, v => marker.setDraggable(v || false));
		watch(() => props.offset, v => marker.setOffset(v || [ 0, 0 ]));
		watch(() => props.pitchAlignment, v => marker.setPitchAlignment(v || 'auto'));
		watch(() => props.rotationAlignment, v => marker.setRotationAlignment(v || 'auto'));

		onBeforeUnmount(marker.remove.bind(marker));

		return { marker };
	},
	render() {
		// nothing
	}
});
