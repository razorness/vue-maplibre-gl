import { describe, expect, it } from 'vitest';
import MglMap from 'components/MglMap.vue';
import { CAMERA_MODEL_EMITS } from 'composable/useCameraModel';
import { MapLib } from 'lib/map.lib';

/*
 * `MglMap` declares its emits as a *type* (`MglMapEmits & MglCameraEmits`), so Vue's SFC compiler has to
 * derive the runtime emits array from it at compile time. That derivation is the whole risk of the
 * type-only form: an emit that does not make it into the array is not an emit at all — Vue lets the
 * listener fall through as an attribute onto the container `div`, where a `map:load` handler is simply
 * never called. It fails silently, in the consumer's app, at runtime.
 *
 * `AssertNever` in `map.lib.ts` proves the *interface* is complete. This proves the compiler turned it
 * into a complete runtime array, which no type-level assertion can show.
 */
describe('MglMap emits', () => {
	const declared = new Set((MglMap as unknown as { emits?: string[] }).emits ?? []);

	it('has a runtime emits array at all', () => {
		expect(declared.size).toBeGreaterThan(0);
	});

	it('declares every maplibre map event, prefixed', () => {
		const missing = MapLib.MAP_EMIT_NAMES.filter(name => !declared.has(name));
		expect(missing).toEqual([]);
		expect(MapLib.MAP_EMIT_NAMES).toHaveLength(55);
	});

	it('declares every camera model update', () => {
		const missing = CAMERA_MODEL_EMITS.filter(name => !declared.has(name));
		expect(missing).toEqual([]);
	});

	it('declares nothing beyond those', () => {
		const known = new Set<string>([...MapLib.MAP_EMIT_NAMES, ...CAMERA_MODEL_EMITS]);
		expect([...declared].filter(name => !known.has(name))).toEqual([]);
	});
});
