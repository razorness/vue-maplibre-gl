import { doc } from 'prettier';
import * as estree from 'prettier/plugins/estree';

const { hardline } = doc.builders;
const basePrinter = estree.printers.estree;

/*
 * Prettier owns all formatting in this repo (see CLAUDE.md), and it normalises blank lines at the
 * start and end of a block away — there is no option for it, and no ESLint rule can restore them
 * without fighting `prettier --check` forever (`eslint-config-prettier` disables `padded-blocks`
 * for exactly that reason). This plugin adds the one thing Prettier will not:
 *
 *   - a blank line after a class body's `{` and before its `}`
 *   - the same around a function body longer than `paddedBlocksMinLines` formatted lines
 *
 * It wraps the built-in estree printer and injects an extra `hardline` into the Doc it returns.
 * That is the only interception point Prettier offers — there is no post-processing hook — so the
 * Doc is only touched when it has the expected `{ … }` shape and returned untouched otherwise. A
 * future Prettier release therefore degrades to "no padding" instead of to broken output.
 *
 * `scripts/check-padded-blocks.mjs` verifies both invariants across the repo: stripping the added
 * blank lines reproduces plain Prettier output byte for byte, and formatting twice is a no-op.
 */

export const options = {
	paddedBlocksClasses: {
		type: 'boolean',
		category: 'Global',
		default: true,
		description: 'Add a blank line after a class body opening brace and before its closing brace.'
	},
	paddedBlocksScope: {
		type: 'choice',
		category: 'Global',
		default: 'methods',
		description: 'Which function bodies are padded once they exceed paddedBlocksMinLines.',
		choices: [
			{ value: 'none', description: 'no function bodies' },
			{ value: 'methods', description: 'class methods, getters and setters only' },
			{ value: 'all', description: 'every function, method and arrow function body' }
		]
	},
	paddedBlocksMinLines: {
		type: 'int',
		category: 'Global',
		default: 4,
		description: 'A function body is padded when its formatted form has more than this many non-blank lines.'
	}
};

const isMethod = path => {
	const kind = path.grandparent?.type;
	return path.parent?.type === 'FunctionExpression' && (kind === 'MethodDefinition' || kind === 'TSAbstractMethodDefinition');
};

const isFunction = path => {
	const kind = path.parent?.type;
	return kind === 'FunctionDeclaration' || kind === 'FunctionExpression' || kind === 'ArrowFunctionExpression';
};

/**
 * Line count of the **formatted** body, not of the source.
 *
 * Counting source lines makes the rule non-idempotent: Prettier may reflow a statement onto more
 * lines (`if (x) { y(); }` becomes three lines), which pushes a body over the threshold only on the
 * second run — and `prettier --check` then fails on freshly formatted code. Blank lines are ignored
 * so that already-padded input measures the same as unpadded input.
 */
function formattedLineCount(inner, opts) {
	try {
		const { formatted } = doc.printer.printDocToString(inner, opts);
		return formatted.split('\n').filter(line => line.trim() !== '').length;
	} catch {
		/* if the doc cannot be rendered in isolation, leave the block alone */
		return 0;
	}
}

/** Prepends a hardline inside the first `indent` found, so the body starts with a blank line. */
function withLeadingBlankLine(parts) {
	for (const [i, part] of parts.entries()) {
		if (part?.type === 'indent') {
			const contents = Array.isArray(part.contents) ? [hardline, ...part.contents] : [hardline, part.contents];
			return parts.with(i, { ...part, contents });
		}
		if (Array.isArray(part)) {
			const injected = withLeadingBlankLine(part);
			if (injected) return parts.with(i, injected);
		}
	}
	return null;
}

export const printers = {
	estree: {
		...basePrinter,
		print(path, opts, print, args) {
			const printed = basePrinter.print(path, opts, print, args);
			const { node } = path;

			const isClass = node.type === 'ClassBody';
			if (!isClass && node.type !== 'BlockStatement') return printed;
			if (!node.body?.length) return printed;

			if (isClass) {
				if (!opts.paddedBlocksClasses) return printed;
			} else {
				const scope = opts.paddedBlocksScope;
				if (scope === 'none') return printed;
				if (scope === 'methods' ? !isMethod(path) : !isFunction(path)) return printed;
			}

			/* both shapes Prettier emits: ["{", indent, hardline, "}"] and ["{", [indent, hardline], "}"] */
			if (!Array.isArray(printed) || printed.length < 3 || printed[0] !== '{' || printed.at(-1) !== '}') {
				return printed;
			}

			const middle = printed.slice(1, -1);
			if (!isClass && formattedLineCount(middle, opts) <= opts.paddedBlocksMinLines) {
				return printed;
			}

			const padded = withLeadingBlankLine(middle);
			return padded ? ['{', ...padded, hardline, '}'] : printed;
		}
	}
};
