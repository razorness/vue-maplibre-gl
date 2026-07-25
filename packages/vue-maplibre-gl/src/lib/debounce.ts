/*
 * Both helpers intentionally drop the `this` forwarding the previous `arguments`/`fn.apply(this)`
 * implementation carried: every call site passes an already bound function
 * (`map.resize.bind(map)`, `this.onMouseMove.bind(this)`), so forwarding `this` was dead weight
 * that only required two `@ts-ignore`s to type.
 */

export type DebouncedFunction<T extends (...args: never[]) => unknown> = ((...args: Parameters<T>) => void) & { cancel: () => void };

export function debounce<T extends (...args: never[]) => unknown>(fn: T, wait = 250, immediate = false): DebouncedFunction<T> {
	let timeout: ReturnType<typeof setTimeout> | undefined;

	const debounced = (...args: Parameters<T>): void => {
		const later = () => {
			timeout = undefined;
			if (!immediate) {
				fn(...args);
			}
		};

		clearTimeout(timeout);
		if (immediate && timeout === undefined) {
			fn(...args);
		}
		timeout = setTimeout(later, wait);
	};

	debounced.cancel = () => {
		clearTimeout(timeout);
		timeout = undefined;
	};

	return debounced;
}

export type ThrottledFunction<T extends (...args: never[]) => unknown> = (...args: Parameters<T>) => ReturnType<T>;

export function throttle<T extends (...args: never[]) => unknown>(fn: T, ms: number): ThrottledFunction<T> {
	let inThrottle = false,
		lastResult: ReturnType<T>;

	return (...args: Parameters<T>): ReturnType<T> => {
		if (!inThrottle) {
			inThrottle = true;
			setTimeout(() => (inThrottle = false), ms);
			lastResult = fn(...args) as ReturnType<T>;
		}

		return lastResult;
	};
}
