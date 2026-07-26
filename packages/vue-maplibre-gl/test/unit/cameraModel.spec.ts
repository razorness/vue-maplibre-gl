import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CAMERA_MODEL_EMITS, useCameraModel } from 'composable/useCameraModel';
import { FakeMap } from '@test/fake-map';

/*
 * The camera binding's whole difficulty is the feedback loop: a prop moves the map, the map settles, the
 * component emits, the parent writes the prop, the map moves again. The guard works by **origin** — every
 * prop-driven change arms a flag that the next settle event consumes — and not by comparing values,
 * because maplibre clamps and rounds what it is given, so what comes back legitimately differs from what
 * went in. These tests pin that behaviour down; a value-based guard would fail the last two.
 */
function bind(bound: string[] = [...CAMERA_MODEL_EMITS]) {
	const emit = vi.fn();
	const binding = useCameraModel(emit, event => bound.includes(event));
	const map = new FakeMap({ container: document.createElement('div') } as never);
	const subscriptions = binding.bind(map as never);
	return { emit, binding, map, subscriptions };
}

beforeEach(() => FakeMap.reset());

describe('useCameraModel', () => {
	it('emits the settled value for every bound property', () => {
		const { emit, map } = bind();

		map.fire('moveend');
		map.fire('zoomend');
		map.fire('rotateend');
		map.fire('pitchend');
		map.fire('rollend');

		const events = emit.mock.calls.map(([event]) => event);
		expect(events).toContain('update:center');
		expect(events).toContain('update:zoom');
		expect(events).toContain('update:bearing');
		expect(events).toContain('update:pitch');
		expect(events).toContain('update:roll');
		expect(events).toContain('update:bounds');
	});

	it('binds nothing for a property the consumer did not v-model', () => {
		const { emit, map } = bind(['update:zoom']);

		map.fire('moveend');
		map.fire('zoomend');

		expect(emit.mock.calls.map(([event]) => event)).toEqual(['update:zoom']);
	});

	it('subscribes only once per settle event, however many properties share it', () => {
		// `center` and `bounds` both settle on `moveend`
		const { subscriptions } = bind(['update:center', 'update:bounds']);

		expect(subscriptions).toHaveLength(1);
	});

	it('listens on the *end events, never on the continuous ones', () => {
		const { emit, map } = bind();

		map.fire('move');
		map.fire('zoom');
		map.fire('rotate');
		map.fire('pitch');

		expect(emit).not.toHaveBeenCalled();
	});

	it('unsubscribes everything it bound', () => {
		const { map, subscriptions } = bind();
		const before = map.listenerCount;
		expect(before).toBeGreaterThan(0);

		for (const subscription of subscriptions) subscription.unsubscribe();

		expect(map.listenerCount).toBe(0);
	});

	/* ---- the echo guard ------------------------------------------------------------------- */

	it('swallows the settle event that its own change caused', () => {
		const { emit, binding, map } = bind();

		binding.markProgrammatic();
		map.fire('moveend');

		expect(emit).not.toHaveBeenCalled();
	});

	it('only ever swallows one event, so the next user movement still emits', () => {
		const { emit, binding, map } = bind();

		binding.markProgrammatic();
		map.fire('moveend');
		expect(emit).not.toHaveBeenCalled();

		map.fire('moveend');
		expect(emit).toHaveBeenCalled();
	});

	/*
	 * The two cases a value comparison gets wrong. maplibre snaps the zoom to whole numbers by default and
	 * clamps the centre to `maxBounds`, so the value coming back differs from the one that was set — a
	 * value guard would treat that as a user movement and emit a correction nobody asked for.
	 */
	it('stays quiet even though the map reports a different value than was set', () => {
		const { emit, binding, map } = bind(['update:zoom']);

		map.setZoom(4.3);
		// what a snapping map reports back
		map.setZoom(4);
		binding.markProgrammatic();
		map.fire('zoomend');

		expect(emit).not.toHaveBeenCalled();
	});

	it('emits a user movement that happens to land on the previous value', () => {
		const { emit, binding, map } = bind(['update:zoom']);

		map.setZoom(5);
		binding.markProgrammatic();
		map.fire('zoomend'); // the programmatic one, swallowed

		map.fire('zoomend'); // the user drags back to exactly 5
		expect(emit).toHaveBeenCalledWith('update:zoom', 5);
	});
});
