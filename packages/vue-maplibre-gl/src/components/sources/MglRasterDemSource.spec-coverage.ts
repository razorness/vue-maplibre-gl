import type MglRasterDemSource from 'components/sources/MglRasterDemSource.vue';
import type { AssertNever, MglSourceOptions } from 'types';

type Props = InstanceType<typeof MglRasterDemSource>['$props'];

/**
 * Proves `MglRasterDemSource` declares a prop for every option of the maplibre `raster-dem` source specification.
 *
 * Replaces the `keysOf<MglSourceOptions<'raster-dem'>>({ … })` list the component used to carry: same
 * compile-time guarantee that a new maplibre option cannot slip through unnoticed, but purely on the type
 * level — no runtime array that duplicates the prop declaration.
 */
export type _MglRasterDemSourceCoversSpec = AssertNever<Exclude<keyof MglSourceOptions<'raster-dem'>, keyof Props>>;
