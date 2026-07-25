/*
 * Safety net for scripts/prettier-plugin-padded-blocks.mjs, which reaches into Prettier's Doc output
 * — an interception point Prettier does not officially offer. Two invariants are checked over every
 * formattable file in the repo:
 *
 *   1. removing the blank lines the plugin adds reproduces plain Prettier output byte for byte,
 *      so the plugin cannot silently reflow anything else,
 *   2. formatting twice changes nothing, so `prettier --check` can never disagree with `--write`.
 *
 * Run by `pnpm lint` and in CI. On a Prettier upgrade this is the file that tells you whether the
 * plugin still works.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import * as prettier from 'prettier';

const PLUGIN = './scripts/prettier-plugin-padded-blocks.mjs';

const files = execFileSync('git', ['ls-files', '*.ts', '*.vue', '*.mjs'], { encoding: 'utf8' }).split('\n').filter(Boolean);

/** Drops blank lines directly after a `{`-terminated line and directly before a `}` line. */
function stripPadding(text) {
	const lines = text.split('\n');
	const out = [];
	for (const [i, line] of lines.entries()) {
		if (line.trim() === '') {
			const prev = out.at(-1)?.trimEnd() ?? '';
			const next = lines.slice(i + 1).find(l => l.trim() !== '') ?? '';
			if (prev.endsWith('{') || next.trim().startsWith('}')) continue;
		}
		out.push(line);
	}
	return out.join('\n');
}

let checked = 0;
const failures = [];

for (const file of files) {
	const source = readFileSync(file, 'utf8');
	const config = await prettier.resolveConfig(file);
	if (config === null) continue;

	const withPlugin = { ...config, filepath: file };
	const withoutPlugin = { ...config, filepath: file, plugins: (config.plugins ?? []).filter(p => p !== PLUGIN) };

	let padded, plain;
	try {
		padded = await prettier.format(source, withPlugin);
		plain = await prettier.format(source, withoutPlugin);
	} catch (error) {
		failures.push(`${file}: formatting threw — ${error.message.split('\n')[0]}`);
		continue;
	}

	if (stripPadding(padded) !== stripPadding(plain)) {
		failures.push(`${file}: the plugin changed more than blank lines`);
	}
	if ((await prettier.format(padded, withPlugin)) !== padded) {
		failures.push(`${file}: not idempotent — formatting twice differs`);
	}
	checked++;
}

if (failures.length > 0) {
	console.error(`padded-blocks: ${failures.length} problem(s)\n` + failures.map(f => `  ${f}`).join('\n'));
	process.exit(1);
}
console.log(`padded-blocks: ${checked} files verified`);
