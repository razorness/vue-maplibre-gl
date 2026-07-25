import type MglVideoSource from 'components/sources/MglVideoSource.vue';
import type { AssertNever, MglSourceOptions } from 'types';

type Props = InstanceType<typeof MglVideoSource>['$props'];

/**
 * Proves `MglVideoSource` declares a prop for every option of the maplibre `video` source specification.
 *
 * Replaces the `keysOf<MglSourceOptions<'video'>>({ … })` list the component used to carry: same
 * compile-time guarantee that a new maplibre option cannot slip through unnoticed, but purely on the type
 * level — no runtime array that duplicates the prop declaration.
 */
export type _MglVideoSourceCoversSpec = AssertNever<Exclude<keyof MglSourceOptions<'video'>, keyof Props>>;
