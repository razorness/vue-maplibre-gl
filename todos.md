# v6 modernisation — status, decisions and open points

Working notes for the `v6` branch. Written to brief a fresh session: what is done, what is deliberately
not done, what needs a decision, and which traps already cost time.

**Read [`CLAUDE.md`](./CLAUDE.md) first.** It is the authority on _how_ the code works — architecture,
conventions, and a Gotchas section that is worth reading before touching anything. This file only covers
status and open work.

- **Branch:** `v6`, 35 commits on top of `7d03ecf` (`origin/master`)
- **Version:** `6.0.0` (was `5.6.1`), not published
- **Base:** maplibre-gl 6.0.0, Vue 3.5, TypeScript 6.0, Vite 8, Vitest 4, pnpm 11, Node `^20.19 || >=22.12`

---

## 1. What this branch does

A full modernisation of the library for maplibre-gl v6, in nine phases (plan file:
`~/.claude/plans/mapliblre-gl-js-v6-ist-rausgekommen-synthetic-creek.md`).

| Area                                                                                  | State                       |
| ------------------------------------------------------------------------------------- | --------------------------- |
| pnpm workspace, ESM only, Vite 8 build with two entries (`.` and `./draw`)            | done                        |
| oxlint + ESLint + Prettier with strictly separated jobs, two Prettier plugins         | done                        |
| Props and events derived from maplibre's types, **proven complete at compile time**   | done                        |
| Generic `MglSource` / `MglLayer` (SFCs with `generic="T">`), named wrappers kept      | done                        |
| Reactive diffing for map, source and layer options                                    | done                        |
| Two-way camera binding for centre, zoom, bearing, pitch, roll and bounds              | done                        |
| Every base feature also available as a composable                                     | done                        |
| v6 feature coverage: popup, marker slots/drag, three new controls, six style settings | done                        |
| Plain CSS in a cascade layer with `--mgl-*` tokens, Tailwind v4 compatible            | done                        |
| Draw plugin behind `./draw`, `styles` as a real prop, SSR-safe                        | done                        |
| VitePress 2 docs that are also the second playground, 20 pages, 5 live demos          | done                        |
| `web-types.json` + API tables generated from one source (`pnpm meta`)                 | done                        |
| Three CI workflows, changesets release, GH-Pages deploy                               | done                        |
| Tests: 232 unit/ssr + 75 browser                                                      | done, coverage gate not met |

### Gates, all green as of the last commit

```
pnpm lint         0 errors, 2 known warnings (vue/one-component-per-file in a test file)
pnpm lint:padding 128 files verified
pnpm typecheck    0 errors across all three tsconfig projects
pnpm test         232 tests (unit + ssr)
pnpm test:browser  75 tests (real Chromium, real maplibre)
pnpm build        ESM only, no .cjs, publint and attw clean
pnpm docs:build   green
```

---

## 2. Open points

### 2.1 Needs a decision — the coverage gate

Coverage is **87.5 % statements / 77.3 % branches**. `vitest.config.ts` sets all four thresholds to
`100`, which is not met, so `ci.yml` runs `pnpm test:coverage || true` — the gate exists but is not
enforced. **Decide the target before enforcing it.**

What is left below 80 %:

| File                                            | Stmts | Why it is still uncovered                                                           |
| ----------------------------------------------- | ----- | ----------------------------------------------------------------------------------- |
| `composable/useDisposableLayer.ts`              | 0 %   | deprecated; still public and still works                                            |
| `components/controls/frameRateControl.ts`       | 57 %  | per-frame canvas drawing; reachable against the canvas fake in `test/setup.unit.ts` |
| `components/MglPopup.vue`                       | 67 %  | remaining `v-model:open` branches                                                   |
| `components/MglMarker.vue`                      | 75 %  |                                                                                     |
| `components/controls/MglCustomControl.vue`      | 75 %  |                                                                                     |
| `components/controls/MglFullscreenControl.vue`  | 75 %  | needs the Fullscreen API                                                            |
| `components/controls/MglStyleSwitchControl.vue` | 79 %  |                                                                                     |
| `lib/map.lib.ts`                                | 75 %  |                                                                                     |
| `lib/layer.lib.ts`                              | 78 %  | `genLayerOpts` and an event-handler edge                                            |

My reading: 100 % is reachable for most of this, but a few branches need a real GPU or real touch events.
A realistic enforced threshold (e.g. 85 % statements / 75 % branches) protects more than an aspirational
100 % that stays switched off. Either way, when you enforce it, drop the `|| true` in `ci.yml`.

### 2.2 Needs a decision — two Prettier settings

1. **Padding scope.** `scripts/prettier-plugin-padded-blocks.mjs` puts blank lines after a class body's
   `{`, before its `}`, and around function bodies longer than 4 formatted lines.
   `paddedBlocksScope` is `'methods'` — class methods, getters and setters only, which is the literal
   reading of the request. That touches 14 files. Setting it to `'all'` in `.prettierrc.json` includes
   every plain function, i.e. nearly all of `composable/` and `lib/`: one line plus a reformat commit.
2. **Values that differ from your other project's config**, left alone because only the sort-imports
   plugin was asked for: `printWidth` 140 (yours: 160), `trailingComma: "none"` (yours: `"all"`),
   `htmlWhitespaceSensitivity` unset (yours: `"ignore"`). Aligning them is a pure reformat commit.

### 2.3 Never executed — verify on the first run

1. **The publish path.** `release.yml` uses changesets with npm OIDC trusted publishing and
   `NPM_CONFIG_PROVENANCE`, so there is no token in the repo. Changesets normally expects `NPM_TOKEN`
   and may refuse without it. Start the first release with `workflow_dispatch` and watch the auth step.
2. **The CI browser job.** It runs `playwright install chromium --with-deps`, which needs root — fine on
   a GitHub runner, but that path has not been exercised. Locally the suite only runs with a workaround
   (see §5).
3. **The docs demos in a browser.** The five demos are typechecked, SSR-safe and the site builds, but
   nobody has clicked through `pnpm docs:dev`. The risk is now small — the 75 browser tests drive the
   same components against real maplibre — but the demo components themselves are not covered.

### 2.4 Optional, not started

**A Nuxt module** (`nuxt/` as a workspace package: auto-imports plus CSS injection). The groundwork is
done — the package is SSR-safe and there is a dedicated `ssr` test project — but the module does not
exist. It was scoped as "can be dropped without affecting anything else".

### 2.5 Known debt, deliberate and documented

- `.oxlintrc.json` keeps several rules at `warn` with a comment naming the reason:
  `typescript/no-explicit-any` (mostly at the `props: any` boundary of the deprecated composables),
  `import/no-cycle` (the draw plugin's `import type`-only cycles, erased at runtime), `no-shadow` (reused
  `len`/`polygon` in the draw geometry). None of these is a defect; do not silence them further without
  fixing the cause.
- Two ESLint warnings: `vue/one-component-per-file`, twice, in `test/unit/composables.spec.ts`.
- `packages/vue-maplibre-gl/src/components/layers/smybol.layer.ts` — the filename typo is **intentional**,
  kept so import paths stay valid. The component is `MglSymbolLayer`.

---

## 3. Bugs the tests found in this session

Recorded because each one shows a class of mistake worth watching for.

1. **`setPrimaryLanguage` was not idempotent.** Every language switch wrapped another `coalesce` around
   the previous result — the rewrite works on what the last pass produced, whose two `get` expressions
   both start with `name`, so both were rewritten and the result wrapped again. The `text-field` grew
   without bound and never shrank. Fixed by recognising a generated `coalesce` and replacing it whole.
2. **Resizing a circle by its _first_ vertex silently did nothing.** The resize anchor is that vertex's
   index, and the guard read `if (!this._resizeAnker) return` — index `0` was indistinguishable from
   "nothing grabbed". The other three vertices always worked. Fixed to `=== undefined`.
3. **The docs told people to write `:options="{ … }"` on components that have no `options` prop.** Only
   the generic `MglSource` / `MglLayer` take `options`; the named wrappers, `MglMarker`, `MglPopup`,
   `MglSky`, `MglLight` and `MglImage` all take flat props. A mocked map ignores an unknown prop, so this
   survived until the browser suite ran against real maplibre, where `addSource` without data throws.
4. **`MglImage` takes a bitmap, not a URL.** `image` is passed straight to `addImage`, which accepts
   `ImageData` / `ImageBitmap` / a loaded image / a `StyleImageInterface`. A URL string type-checks and
   then does nothing. The guide now warns about it.

---

## 4. Traps that already cost time

Do not rediscover these.

- **`map.loaded()` never becomes true under a software WebGL renderer.** It also requires the map to be
  _idle_, and SwiftShader keeps it dirty. Every browser test timed out on it while the library was
  working. Wait for the `@map:load` event instead.
- **Reading a style property during a style switch throws from inside maplibre.** The style is briefly
  gone while it is swapped, so anything that polls has to gate on `isStyleLoaded()` — which v6 types as
  `boolean | void`.
- **A mutated plain variable does not drive a re-render.** The children thunk in the browser helpers is a
  render function, so only a reactive read (`ref`) makes Vue re-run it. Three tests silently proved
  nothing until this was fixed.
- **`onMouseMove` in the draw modes is throttled to 16 ms.** Two moves fired back to back swallow the
  second, after which the closing click splices out a real vertex. Tests advance the clock between moves.
- **`useLayer` cannot sit in the same `setup()` as `useSource`.** `provide()` reaches descendants only, so
  the layer has to be in a child component or name its source explicitly.
- **`vue-component-meta` drops JSDoc for type-declared emits** — inline or imported, measured both ways.
  Props and slots carry their comments; event descriptions have to live in the guide pages.
- **A prop `default` is evaluated when the module is evaluated.** `default: 4 * window.devicePixelRatio`
  once made the whole package unimportable server-side.
- **`git stash` was used once in this tree and lost work.** It was recovered, but do not use it here.

---

## 5. Running the browser tests locally

`pnpm test:browser` needs Chromium plus the system libraries it links against:

```sh
pnpm --filter vue-maplibre-gl exec playwright install chromium --with-deps   # needs root
pnpm test:browser
```

Without root, `--with-deps` fails and the browser exits before Playwright can talk to it
(`libnspr4.so: cannot open shared object file`). The workaround used in this session: download the
packages and hand them to the loader.

```sh
mkdir -p /tmp/pw-libs && cd /tmp/pw-libs
apt-get download libnspr4 libnss3 libasound2t64 libatk-bridge2.0-0t64 libatk1.0-0t64 \
  libatspi2.0-0t64 libcups2t64 libdrm2 libgbm1 libxcomposite1 libxdamage1 libxfixes3 \
  libxkbcommon0 libxrandr2 libpango-1.0-0 libcairo2
for d in *.deb; do dpkg-deb -x "$d" extracted; done
export LD_LIBRARY_PATH="/tmp/pw-libs/extracted/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH"
pnpm test:browser
```

The suite needs no network: `test/browser/style.ts` holds complete inline styles, and tile URLs point at
`example.invalid` on purpose — those requests fail and nothing asserts on them.

---

## 6. Conventions for commits in this repo

- **English only**, no `Co-Authored-By` trailer, no reference to the plan's phase numbers.
- Thematically coherent commits, subject plus at most two explanatory sentences.
- Author **and** committer must be `Volker Nauruhn <684302+razorness@users.noreply.github.com>`. Pass it
  inline (`GIT_AUTHOR_EMAIL=… GIT_COMMITTER_EMAIL=… git commit`) — the environment injects a different
  address that beats every config file, and twelve commits had to be rebuilt because of it.
- After touching a prop, event, slot or doc comment: run `pnpm meta` and commit the result. `web-types.json`
  ships in the tarball, and CI fails if it is stale. Also after a version bump — the version is embedded.

---

## 7. Suggested order for picking this up

1. Answer §2.1 and §2.2 — both are one-line changes plus a reformat, and both block a clean CI.
2. Push the branch, open the PR, and let CI run for real. That validates §2.3.2 in one go.
3. Close the remaining coverage gaps in §2.1 — `frameRateControl.ts` and the popup/marker branches are
   the reachable ones and need no decision.
4. Click through `pnpm docs:dev` once (§2.3.3).
5. First release via `workflow_dispatch`, watching the auth step (§2.3.1).
6. Then, if wanted, the Nuxt module (§2.4).
