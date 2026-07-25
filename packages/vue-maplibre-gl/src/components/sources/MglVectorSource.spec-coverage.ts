import type MglVectorSource from 'components/sources/MglVectorSource.vue';
import type { AssertNever, MglSourceOptions } from 'types';

type Props = InstanceType<typeof MglVectorSource>['$props'];

/**
 * Proves `MglVectorSource` declares a prop for every option of the maplibre `vector` source specification.
 *
 * Replaces the `keysOf<MglSourceOptions<'vector'>>({ … })` list the component used to carry: same
 * compile-time guarantee that a new maplibre option cannot slip through unnoticed, but purely on the type
 * level — no runtime array that duplicates the prop declaration.
 */
export type _MglVectorSourceCoversSpec = AssertNever<Exclude<keyof MglSourceOptions<'vector'>, keyof Props>>;
