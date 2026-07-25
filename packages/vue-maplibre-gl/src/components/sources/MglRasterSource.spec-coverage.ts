import type MglRasterSource from 'components/sources/MglRasterSource.vue';
import type { AssertNever, MglSourceOptions } from 'types';

type Props = InstanceType<typeof MglRasterSource>['$props'];

/**
 * Proves `MglRasterSource` declares a prop for every option of the maplibre `raster` source specification.
 *
 * Replaces the `keysOf<MglSourceOptions<'raster'>>({ … })` list the component used to carry: same
 * compile-time guarantee that a new maplibre option cannot slip through unnoticed, but purely on the type
 * level — no runtime array that duplicates the prop declaration.
 */
export type _MglRasterSourceCoversSpec = AssertNever<Exclude<keyof MglSourceOptions<'raster'>, keyof Props>>;
