import type { Source } from 'maplibre-gl';
import { shallowRef, type ShallowRef } from 'vue';

/**
 * Tri-state handle on a maplibre source, shared between the source component that owns it and the
 * layer components that need to wait for it.
 *
 * | value       | meaning                                                                    |
 * | ----------- | -------------------------------------------------------------------------- |
 * | `Source`    | added to the map and ready; layers may be added                            |
 * | `null`      | a source with this id is expected but not added yet, or was just torn down by a style switch |
 * | `undefined` | nothing to wait for — the layer names no source id, so it can be added at once |
 *
 * The `null` vs `undefined` distinction is load-bearing: `useDisposableLayer` adds its layer when the
 * value is a `Source` **or** `undefined`, and holds off while it is `null`.
 */
export type SourceRef = ShallowRef<Source | null | undefined>;

/**
 * Per-map registry of source handles.
 *
 * Replaces the previous module-level `SourceLib.REFS`, which was keyed by
 * `String(mapComponentUid) + sourceId`, never pruned — so every source of every map that had ever been
 * mounted stayed reachable for the lifetime of the page — and collapsed *all* sources without a string
 * id onto one shared entry, because the key degenerated to just the uid.
 *
 * One registry instance is created by `MglMap` and provided to its subtree, so it is garbage collected
 * together with the map and cannot leak across maps.
 */
export class MglSourceRegistry {

	private readonly refs = new Map<string, SourceRef>();

	/**
	 * The shared handle for `sourceId`.
	 *
	 * Anything that is not a non-empty string means "no source to wait for" and yields a detached
	 * `undefined` ref that is deliberately *not* stored: such layers do not participate in
	 * source-readiness tracking, and storing them under a shared key is what previously made unrelated
	 * layers observe each other's state.
	 */
	get(sourceId: string | undefined): SourceRef {

		if (typeof sourceId !== 'string' || sourceId === '') {
			return shallowRef<Source | null | undefined>(undefined);
		}

		let ref = this.refs.get(sourceId);
		if (!ref) {
			ref = shallowRef<Source | null | undefined>(null);
			this.refs.set(sourceId, ref);
		}
		return ref;

	}

	/** Called by a source component once maplibre has the source. */
	set(sourceId: string, source: Source | null) {
		this.get(sourceId).value = source;
	}

	/**
	 * Marks every tracked source as pending.
	 *
	 * Used on `styleSwitched`: `setStyle({ diff: false })` throws every source and layer away, so all
	 * handles must go back to `null` until the sources have been re-added on `style.load`.
	 */
	resetAll() {
		for (const ref of this.refs.values()) {
			ref.value = null;
		}
	}

	/** Drops the handle for a source that is being unmounted for good. */
	delete(sourceId: string) {
		this.refs.delete(sourceId);
	}

	/** Test seam: how many handles are currently tracked. */
	get size(): number {
		return this.refs.size;
	}

}
