import type { Map as MaplibreMap } from 'maplibre-gl';
import { render } from 'vitest-browser-vue';
import { defineComponent, h, nextTick, shallowRef, type Component, type ShallowRef } from 'vue';
import MglMap from 'components/MglMap.vue';
import { blankStyle } from './style';

/*
 * Shared scaffolding for the browser suite. Every test here drives the *real* maplibre in real Chromium,
 * so the two things that need care are waiting correctly and cleaning up.
 */

let cleanups: Array<() => void> = [];

/** Call from `afterEach`. */
export function cleanupMounted() {
	for (const cleanup of cleanups) cleanup();
	cleanups = [];
}

/** Waits for a condition maplibre reaches asynchronously (a style load, a re-add, a tile). */
export async function until(predicate: () => boolean, message: string, timeout = 15_000) {
	const deadline = Date.now() + timeout;
	while (!predicate()) {
		if (Date.now() > deadline) throw new Error(`timed out waiting for: ${message}`);
		await new Promise(resolve => setTimeout(resolve, 50));
	}
}

export interface MountedMap {
	map: MaplibreMap;
	/** Every error maplibre reported, so a test can assert on them or ignore expected tile failures. */
	errors: unknown[];
	rerender: () => Promise<void>;
	unmount: () => void;
}

/**
 * Mounts an `<MglMap>` with the given children and resolves once maplibre has fired `load`.
 *
 * Deliberately waits for the `@map:load` event rather than `map.loaded()`: the latter also requires the
 * map to be *idle*, and under a software WebGL renderer it stays dirty forever, so it never returns true.
 */
export async function mountMap(
	children: () => unknown,
	mapProps: Record<string, unknown> = {},
	options: { style?: unknown | (() => unknown) } = {}
): Promise<MountedMap> {
	const mapRef: ShallowRef<MaplibreMap | undefined> = shallowRef();
	const errors: unknown[] = [];

	const component = defineComponent({
		setup() {
			return () =>
				h(
					MglMap,
					{
						mapStyle: (typeof options.style === 'function' ? (options.style as () => unknown)() : options.style) ?? blankStyle,
						style: 'width: 400px; height: 300px',
						...mapProps,
						'onMap:load': (event: { map: MaplibreMap }) => (mapRef.value = event.map),
						'onMap:error': (event: unknown) => errors.push(event)
					} as never,
					{ default: children }
				);
		}
	});

	const screen = render(component);
	cleanups.push(() => screen.unmount());

	await until(() => !!mapRef.value, 'maplibre to fire load — is WebGL available?', 25_000);
	await nextTick();

	return {
		map: mapRef.value!,
		errors,
		rerender: async () => {
			await nextTick();
			await nextTick();
		},
		unmount: () => screen.unmount()
	};
}

/** Mounts a bare component (no `MglMap` wrapper) — for the composable tests. */
export function mountBare(component: Component) {
	const screen = render(component);
	cleanups.push(() => screen.unmount());
	return screen;
}

/** A 1×1 transparent PNG, so an image source has something real to load without a network. */
export const pixelPng =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QzwAEAgEBAOfnJvUAAAAASUVORK5CYII=';
