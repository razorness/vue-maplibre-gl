export function createElement<K extends keyof HTMLElementTagNameMap>(tagName: K, classes: string): HTMLElementTagNameMap[K] {
	const element = document.createElement(tagName);
	element.classList.add(classes);
	return element;
}
