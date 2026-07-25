import type MglGeoJsonSource from 'components/sources/MglGeoJsonSource.vue';
import type { AssertNever, MglSourceOptions } from 'types';

type Props = InstanceType<typeof MglGeoJsonSource>['$props'];

/**
 * Proves `MglGeoJsonSource` declares a prop for every option of the maplibre `geojson` source specification.
 *
 * Replaces the `keysOf<MglSourceOptions<'geojson'>>({ … })` list the component used to carry: same
 * compile-time guarantee that a new maplibre option cannot slip through unnoticed, but purely on the type
 * level — no runtime array that duplicates the prop declaration.
 */
export type _MglGeoJsonSourceCoversSpec = AssertNever<Exclude<keyof MglSourceOptions<'geojson'>, keyof Props>>;
