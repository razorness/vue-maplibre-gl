import { renderToString } from '@vue/server-renderer';
import { describe, expect, it } from 'vitest';
import { createSSRApp, h } from 'vue';

/**
 * Runs in the `node` environment — **no jsdom**, so `window` and `document` genuinely do not exist.
 *
 * That is the whole point: a jsdom test can never catch a server-side `window` access, because jsdom
 * provides one. This is the environment that caught `AbstractDrawMode.isTouchEventSupported` being a class
 * *field* (`window !== undefined`, evaluated on import, throwing a `ReferenceError` rather than yielding
 * `false` — `typeof window` is the safe form).
 */
describe('server-side rendering', () => {
	it('has no DOM globals, so the assertions below mean something', () => {
		expect(typeof window).toBe('undefined');
		expect(typeof document).toBe('undefined');
	});

	it('imports the main entry without touching the DOM', async () => {
		await expect(import('@/index')).resolves.toBeDefined();
	});

	it('imports the draw plugin without touching the DOM', async () => {
		/* the regression: this used to throw on import alone */
		await expect(import('plugins/draw/index')).resolves.toBeDefined();
	});

	it('renders MglMap to markup, with children skipped', async () => {
		const { MglMap } = await import('@/index');

		const html = await renderToString(
			createSSRApp({
				render: () =>
					h(
						MglMap as never,
						{ mapStyle: 'https://example.invalid/style.json' },
						{
							/*
							 * Children must not run server-side: they construct maplibre objects and touch the DOM.
							 * `MglMap` gates its slot behind `v-if="isInitialized"`, which is false until `onMounted`
							 * — so this render proves the gate holds rather than that the children are SSR-safe.
							 */
							default: () => h('span', { id: 'slot-marker' }, 'rendered')
						}
					)
			})
		);

		expect(html).toContain('mgl-container');
		expect(html).toContain('mgl-wrapper');
		/*
		 * Matched on the element id, not on the slot's text: the container markup carries an HTML comment
		 * that happens to contain the word "children", which a naive `not.toContain('child')` matches.
		 */
		expect(html, 'the slot must not render on the server').not.toContain('slot-marker');
	});

	it('evaluates the draw mode touch check without a window', async () => {
		const { AbstractDrawMode } = await import('plugins/draw/mode.abstract');
		const descriptor = Object.getOwnPropertyDescriptor(AbstractDrawMode.prototype, 'isTouchEventSupported');

		expect(descriptor?.get, 'must be a lazy getter, not a class field').toBeTypeOf('function');
		expect(descriptor!.get!.call({})).toBe(false);
	});
});
