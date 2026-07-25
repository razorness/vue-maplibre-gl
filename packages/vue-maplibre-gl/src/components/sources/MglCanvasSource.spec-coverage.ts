import type MglCanvasSource from 'components/sources/MglCanvasSource.vue';
import type { AssertNever, MglSourceOptions } from 'types';

type Props = InstanceType<typeof MglCanvasSource>['$props'];

/**
 * Proves `MglCanvasSource` declares a prop for every option of the maplibre `canvas` source specification.
 *
 * Replaces the `keysOf<MglSourceOptions<'canvas'>>({ … })` list the component used to carry: same
 * compile-time guarantee that a new maplibre option cannot slip through unnoticed, but purely on the type
 * level — no runtime array that duplicates the prop declaration.
 */
export type _MglCanvasSourceCoversSpec = AssertNever<Exclude<keyof MglSourceOptions<'canvas'>, keyof Props>>;
