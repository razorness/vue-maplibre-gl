import type MglImageSource from 'components/sources/MglImageSource.vue';
import type { AssertNever, MglSourceOptions } from 'types';

type Props = InstanceType<typeof MglImageSource>['$props'];

/**
 * Proves `MglImageSource` declares a prop for every option of the maplibre `image` source specification.
 *
 * Replaces the `keysOf<MglSourceOptions<'image'>>({ … })` list the component used to carry: same
 * compile-time guarantee that a new maplibre option cannot slip through unnoticed, but purely on the type
 * level — no runtime array that duplicates the prop declaration.
 */
export type _MglImageSourceCoversSpec = AssertNever<Exclude<keyof MglSourceOptions<'image'>, keyof Props>>;
