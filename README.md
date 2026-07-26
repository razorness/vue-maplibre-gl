# vue-maplibre-gl — monorepo

**[Documentation and live examples →](https://razorness.github.io/vue-maplibre-gl/)**

Vue 3 components for [maplibre-gl](https://maplibre.org/). This repository is a pnpm workspace;
the published package lives in [`packages/vue-maplibre-gl`](./packages/vue-maplibre-gl).

| Path                                                     | What it is                                                                |
| -------------------------------------------------------- | ------------------------------------------------------------------------- |
| [`packages/vue-maplibre-gl`](./packages/vue-maplibre-gl) | the published `vue-maplibre-gl` package (incl. the `./draw` plugin entry) |
| `playground/`                                            | dev sandbox, consumes the package straight from source                    |
| `docs/`                                                  | documentation site                                                        |

## Getting started

Requires Node `^20.19.0 || >=22.12.0` and pnpm (via `corepack`).

```shell
pnpm install
pnpm dev          # playground dev server
pnpm build        # build the package (typecheck + bundle + d.ts)
pnpm typecheck    # vue-tsc across all workspaces
pnpm lint         # oxlint (correctness) + eslint (Vue templates) + prettier --check
pnpm format       # prettier --write .
pnpm test         # unit tests
```

## Notes for contributors

- **ESM only.** maplibre-gl v6 ships no CommonJS entry at all, so neither does this package.
- **Formatting is Prettier's.** Write code however you like, then run `pnpm format`. `pnpm lint`
  fails on unformatted files, so CI stays deterministic. Never add formatting rules to ESLint or
  oxlint — `eslint-config-prettier` deliberately switches them off.
- The library is consumed from source in `playground/`, so library changes hot-reload.

See [`CLAUDE.md`](./CLAUDE.md) for a tour of the architecture.
