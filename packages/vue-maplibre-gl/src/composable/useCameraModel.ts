import type { LngLat, LngLatBounds, Map as MaplibreMap, Subscription } from 'maplibre-gl';
import type { AssertNever } from 'types/exhaustive';

/**
 * The camera properties `MglMap` supports two-way binding for:
 * `v-model:center`, `v-model:zoom`, `v-model:bearing`, `v-model:pitch`, `v-model:roll`,
 * `v-model:bounds`.
 */
export interface CameraModel {
	center: LngLat;
	zoom: number;
	bearing: number;
	pitch: number;
	roll: number;
	bounds: LngLatBounds;
}

export type CameraModelKey = keyof CameraModel;

/** The `update:*` emit names for the camera models, for `MglMap`'s `emits` declaration. */
export const CAMERA_MODEL_EMITS = [
	'update:center',
	'update:zoom',
	'update:bearing',
	'update:pitch',
	'update:roll',
	'update:bounds'
] as const satisfies ReadonlyArray<`update:${CameraModelKey}`>;

/**
 * Payload type per camera `update:*` event.
 *
 * Spelled out for the same reason as {@link MglMapEmits}: the SFC compiler generates the runtime emits
 * array at compile time and cannot evaluate a mapped type. The assertions below tie it to
 * {@link CameraModel}, so adding a camera property without an emit stops compiling.
 */
export interface MglCameraEmits {
	'update:center': [value: CameraModel['center']];
	'update:zoom': [value: CameraModel['zoom']];
	'update:bearing': [value: CameraModel['bearing']];
	'update:pitch': [value: CameraModel['pitch']];
	'update:roll': [value: CameraModel['roll']];
	'update:bounds': [value: CameraModel['bounds']];
}

/** Proves every camera property has an emit. Exported only to satisfy `noUnusedLocals`. */
export type _CameraEmitsAreComplete = AssertNever<Exclude<`update:${CameraModelKey}`, keyof MglCameraEmits>>;

/** The other direction: no emit for a property that is not a camera model. */
export type _CameraEmitsHaveNoExtras = AssertNever<Exclude<keyof MglCameraEmits, `update:${CameraModelKey}`>>;

/** maplibre getter per camera property. */
const READERS: { [K in CameraModelKey]: (map: MaplibreMap) => CameraModel[K] } = {
	center: map => map.getCenter(),
	zoom: map => map.getZoom(),
	bearing: map => map.getBearing(),
	pitch: map => map.getPitch(),
	roll: map => map.getRoll(),
	bounds: map => map.getBounds()
};

/**
 * The maplibre event after which each property has settled.
 *
 * Deliberately the `*end` events rather than the continuous ones: emitting `update:center` on every
 * `move` frame would push a new value into the parent ~60 times a second, and every one of those would
 * come straight back in as a programmatic camera change.
 */
const SETTLED_EVENTS: Record<CameraModelKey, 'moveend' | 'zoomend' | 'rotateend' | 'pitchend' | 'rollend'> = {
	center: 'moveend',
	zoom: 'zoomend',
	bearing: 'rotateend',
	pitch: 'pitchend',
	roll: 'rollend',
	bounds: 'moveend'
};

export interface CameraModelBinding {
	/** Must be called before every prop-driven camera change, to arm the echo guard. */
	markProgrammatic: () => void;
	/** Subscribes the settle listeners; returns the subscriptions for teardown. */
	bind: (target: MaplibreMap) => Subscription[];
}

/**
 * Two-way binding for the camera properties.
 *
 * The hard part is not the plumbing but the feedback loop: a prop change moves the map, the map fires
 * `moveend`, the component emits `update:*`, the parent writes the prop, which moves the map again.
 *
 * The guard works by **origin, not by value**. Comparing the emitted value against the prop looks
 * tempting but is unreliable: maplibre clamps and rounds what you give it (`setZoom(1.0001)` with
 * `zoomSnap` on, a `center` constrained by `maxBounds`), so the value coming back legitimately differs
 * from the one going in and a value guard would either loop anyway or swallow real updates.
 *
 * Instead every prop-driven change calls {@link CameraModelBinding.markProgrammatic}, and the next
 * settle event consumes that flag instead of emitting. A genuine user interaction is unaffected because
 * the flag only ever suppresses one event.
 *
 * Nothing is bound for a model the consumer did not `v-model`, so unused bindings cost nothing.
 */
export function useCameraModel(emit: (event: string, value: unknown) => void, hasListener: (event: string) => boolean): CameraModelBinding {
	let applyingProps = false;

	return {
		markProgrammatic() {
			applyingProps = true;
		},

		bind(target: MaplibreMap): Subscription[] {
			const subscriptions: Subscription[] = [],
				// several properties settle on the same event; one maplibre listener covers them all
				byEvent = new globalThis.Map<string, CameraModelKey[]>();

			for (const key of Object.keys(READERS) as CameraModelKey[]) {
				if (!hasListener(`update:${key}`)) {
					continue;
				}
				const event = SETTLED_EVENTS[key];
				byEvent.set(event, [...(byEvent.get(event) ?? []), key]);
			}

			for (const [event, keys] of byEvent) {
				subscriptions.push(
					target.on(event as 'moveend', () => {
						if (applyingProps) {
							applyingProps = false;
							return;
						}
						for (const key of keys) {
							emit(`update:${key}`, READERS[key](target));
						}
					})
				);
			}

			return subscriptions;
		}
	};
}
