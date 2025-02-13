export function debounce(fn: Function, wait = 250, immediate = false) {
	let timeout: number | undefined;

	function debounced(/* ...args */) {
		const args = arguments;

		const later = () => {
			timeout = undefined;
			if (immediate !== true) {
				// @ts-ignore
				fn.apply(this, args);
			}
		};

		clearTimeout(timeout!);
		if (immediate === true && timeout === undefined) {
			// @ts-ignore
			fn.apply(this, args);
		}
		timeout = window.setTimeout(later, wait);
	}

	debounced.cancel = () => {
		clearTimeout(timeout!);
	};

	return debounced;
}


export type ThrottledFunction<T extends (...args: any) => any> = (...args: Parameters<T>) => ReturnType<T>;

export function throttle<T extends (...args: any) => any>(func: T, ms: number): ThrottledFunction<T> {
	let inThrottle: boolean;
	let lastResult: ReturnType<T>;

	return function (this: any): ReturnType<T> {
		const args    = arguments;
		const context = this;

		if (!inThrottle) {
			inThrottle = true;

			setTimeout(() => (inThrottle = false), ms);

			lastResult = func.apply(context, args as unknown as any[]);
		}

		return lastResult;
	};
}
