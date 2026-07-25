import type { MapGeoJSONFeature, PointLike, QueryRenderedFeaturesOptions } from 'maplibre-gl';
import { onBeforeUnmount, shallowRef, toValue, watch, type MaybeRefOrGetter, type ShallowRef } from 'vue';
import { useMapContext, type MapOrRef } from 'composable/useMapContext';

export interface UseQueryRenderedFeaturesReturn {
	/** The features currently rendered under `geometry`. Empty until the map has drawn once. */
	features: ShallowRef<MapGeoJSONFeature[]>;
	/** Re-runs the query immediately. */
	refresh: () => void;
}

/**
 * Keeps a reactive list of the features rendered at a point or box.
 *
 * Re-queries on `idle` rather than `render`: `render` fires many times per frame during any camera
 * movement, and `queryRenderedFeatures` walks the tile index on every call, so binding it to `render`
 * is a straightforward way to make a map stutter. `idle` fires once the map has settled and finished
 * drawing, which is also the first moment the answer is actually stable.
 *
 * Pass a getter or ref for `geometry`/`options` to re-query when they change.
 */
export function useQueryRenderedFeatures(
	geometry?: MaybeRefOrGetter<PointLike | [PointLike, PointLike] | undefined>,
	options?: MaybeRefOrGetter<QueryRenderedFeaturesOptions | undefined>,
	explicitMap?: MapOrRef
): UseQueryRenderedFeaturesReturn {
	const { map, isLoaded } = useMapContext(explicitMap),
		features = shallowRef<MapGeoJSONFeature[]>([]);

	function refresh() {
		if (!isLoaded.value || !map.value) {
			return;
		}
		const target = toValue(geometry),
			opts = toValue(options);
		features.value = target ? map.value.queryRenderedFeatures(target, opts) : map.value.queryRenderedFeatures(opts);
	}

	const stop = watch([isLoaded, () => toValue(geometry), () => toValue(options)], refresh, { immediate: true, deep: true });

	const subscription = map.value!.on('idle', refresh);

	onBeforeUnmount(() => {
		stop();
		subscription.unsubscribe();
	});

	return { features, refresh };
}
