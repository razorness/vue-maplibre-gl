/**
 * An object that must carry **every** key of `T` — optional keys included.
 *
 * The value is irrelevant (always `0`); only the key set is checked.
 */
export type ExhaustiveKeys<T extends object> = { readonly [K in keyof Required<T>]: 0 };

/**
 * Turns a compile-time key set into a runtime array, exhaustively.
 *
 * TypeScript cannot enumerate the keys of a type at runtime, so the list has to exist as a value
 * somewhere. Passing it through `ExhaustiveKeys<T>` makes the compiler reject the call as soon as
 * `T` gains or loses a key — which is exactly what should happen when maplibre-gl adds a map
 * option or an event: **a build error, not a silent gap.**
 *
 * ```ts
 * const MAP_EVENTS = keysOf<MapEventType>({ load: 0, click: 0, ... });
 * //    ^? ("load" | "click" | ...)[]
 * ```
 *
 * Generalises the `AllOptions`/`AllSourceOptions` pattern this library used for source
 * specifications only; both are kept as deprecated aliases.
 */
export function keysOf<T extends object>(keys: ExhaustiveKeys<T>): Array<keyof T> {
	return Object.keys(keys) as Array<keyof T>;
}

/**
 * Same as {@link keysOf}, but drops keys that exist on the maplibre type yet must not become a
 * component prop — `container` (owned by the component) and `style` (exposed as `mapStyle`).
 *
 * Keeping the exclusion explicit means the exhaustiveness check above still covers those keys.
 */
export function keysOfExcept<T extends object, E extends keyof T>(
	keys: ExhaustiveKeys<T>,
	except: readonly E[]
): Array<Exclude<keyof T, E>> {
	return (Object.keys(keys) as Array<keyof T>).filter(k => !except.includes(k as E)) as Array<Exclude<keyof T, E>>;
}

/**
 * Compile-time assertion that a union is empty. Used to prove that a prop declaration covers every
 * key of the corresponding maplibre options type:
 *
 * ```ts
 * type _cover = AssertNever<Exclude<keyof MapOptions, 'container' | 'style' | keyof typeof mapProps>>;
 * ```
 *
 * If a key is missing the type argument resolves to that key and the assignment fails, naming the
 * offending option in the error message.
 */
export type AssertNever<T extends never> = T;
