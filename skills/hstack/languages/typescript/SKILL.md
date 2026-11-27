---
name: hstack-typescript
description: "TypeScript conventions observed in vscode, TypeScript, angular and next.js: commit format, strictness scoping, any-avoidance, typecheck before claiming. Part of the hstack skill: loaded through ROUTES.md whenever the task touches TypeScript, not on its own."
user-invocable: false
disable-model-invocation: true
---

# TypeScript (evidence draft)

Read this when the task touches `.ts`, `.tsx` or `tsconfig*.json`. It adds TypeScript specifics to the
general guides (`think/`, `engineering/`); the project's own config and conventions still win.

> Generated only from observed commits and opened files in the 4 repos below. No inferred or general TypeScript advice beyond what is cited. Single-repo patterns are labelled and must not be generalized.

## 1) Evidence & method

Repos: `microsoft/vscode`, `microsoft/TypeScript`, `angular/angular`, `vercel/next.js`.

Bounds (do not widen): vscode 172752 full single-branch (`git log --format=%s | wc -l = 172752`, HEAD `d0a658e1853`); angular 39508 full single-branch main; microsoft/TypeScript 1000-subject `gh api` sample pages 1-10 (300 with hashes) — full-history `git clone/fetch` failed (`tmp_pack`/`invalid index-pack`); next.js 5000 detailed / 37067 keyword-only (`git log total=37067`). Critic bounds preserved verbatim: 'vscode 172752 full single-branch, angular 39508 full single-branch, TS 1000-subject gh sample, next 5000 detailed / 37067 keyword-only.'

Method: verbatim subjects/counts and files actually opened via `git show`/`ls-tree`/`gh`; subjects only — 'type-changing commits not naming types in subject are uncounted' (critic unresolved).

## 2) Commit conventions observed

`type(scope):` form in all 4: vscode `feat(sessions): mark a chat done when its canvas is closed from the sidebar (#350391)`; TypeScript `fix(65682): preserve export bindings in commonjs postfix updates (#65701)` (single-repo scope form: issue number); angular `feat(devtools): add filter to the side pane in the component tab`; next.js `feat(turbopack): Add EmitOption trait for extensible chunking context configuration (#101001)`.

Fix-dominance (methods differ, not like-for-like): vscode first-word `fix 21017`/172752; TypeScript prefix `fix 281`/1000; angular prefix `fix 8069`/39508; next.js keyword `fix 768`/5000.

Other prefixes: vscode anchored `feat 685-699, chore 788-911, refactor 778, perf 176 (+[Perf] 44), docs 77-91`; angular ALL `docs 8735, refactor 7092, build 5816, feat 3403, test 1791, perf 442` and guideline types `build|ci|docs|feat|fix|perf|refactor|test` (`commit-message-guidelines.md:36`); TypeScript `[api] 61/1000, feat 6, perf 4, chore 2, refactor 0` at subject start; next.js 5000 `docs: 413, test: 195, fix: 193, chore: 40, feat: 38, perf: 31, refactor: 30`.

Revert in all 4: vscode anchored `revert 2027-2037`, e.g. `Revert "keybindings: add editable system-wide scope in Keyboard Shortcuts" (#348827)`; angular `revert 671-682`; next.js first-word `revert 62`/5000; TypeScript `Revert "Report cyclic structures and truncation during declaration emit" (#65567)`.

First verbs after colon (angular recent 5000): `update 976, add 551, remove 282, fix 278`; vscode first-word: `merge 18073, add 9405, update 6197, remove 5275`.

Single-repo forms — do not generalize: vscode `debt` first-word 1525, scopes `sessions 2286, agentHost 1667`, bracket `[Perf] Release discarded draft session state (#348922)`; angular `BREAKING CHANGE` in body 576 vs subject `breaking 76` (single-repo: angular/angular); next.js `Turbopack 507`/5000 top prefix (single-repo: vercel/next.js); TypeScript `[api]` prefix (single-repo, 1000-sample: microsoft/TypeScript).

## 3) TypeScript-specific change patterns observed in commits

Avoid/replace `any` (2 repos, verbatim): angular `b10021c79b refactor(localize): replace `any` with `unknown` in messages and translations utils`, `5d76720e06 refactor(compiler): replace `any` casts with precise types`, `c5da47f63f refactor: replace `any` with stricter types in common and core`; next.js `ec81c0e8f4 Fix canary lint: remove `as any` casts in load-manifest.test.ts (@next/internal/no-as-any) (#101910)`, `e12bdb87ad Lint against new `as any` casts and require a reason to disable it (#101255)`, `ce9c80088e Remove unnecessary `as any` casts (#100418)`.

Strictness migration (single-repo: microsoft/vscode): `Converted another ~70 test files to strictNullChecks (#65672)`, `Converted about 25 *.test.ts files to --strictNullChecks (mostly automatically) (#65581)`, `Enable strictNullChecks for implicit projects (#149844)`, `Make script blocks respect js/ts.implicitProjectConfig.strictNullChecks (#179333)`; vscode substring `strict 1298 (0.75%)`, `strictNullChecks 17`.

Declaration/`d.ts` (vscode): `update monaco.d.ts (#319636)`, `update vscode.proposed.chatPromptFiles.d.ts (#308757)`, substring `d.ts 317 (0.18%)`; TypeScript: `Fix CommonJS declaration emit crashes (#65498)`, `Fix invalid decorator examples in lib.decorators.d.ts (#64353)`, word `declaration 50`/1000.

Compiler/type mechanics (single-repo, 1000-sample: microsoft/TypeScript): `Fixed mapped types not being considered as homomorphic with substitution constraints (#63905)`, `Cache the constraint of generic indexed access types (#65664)`, `Produce union types when instantiating generic contextual types (#65617)`, `Make index signature declarations without a type annotation an implicit any, not a grammar error (#65283)`, `Add a regression test for narrowing NoInfer union constituents of non-generic aliases (#64969)`.

TypeScript-version upgrades (>=2 repos): vscode `Move to TypeScript 7.1.0 dev build (#344735)`; angular `build: update dependency typescript to v6.0.3`, `feat(core): drop support for TypeScript 5.9`; next.js `(TypeScript 7 Support) Add experimental TypeScript CLI backend (#95639)`, `Enable TypeScript CLI by default (#96497)`.

ESM (vscode): `use ESM for HTML/CSS/JSON language servers (#309566)`, substring `ESM 177`; angular (single-repo): `build: remove the esm interop patches and tooling (#62879)`.

## 4) Repo/workflow patterns observed (files/scripts actually cited)

vscode: `src/tsconfig.base.json` — `"strict": true, "noImplicitReturns": true, "noImplicitOverride": true, "noUnusedLocals": true, "module":"nodenext", "target":"ES2024"`; 133 `tsconfig*.json`; `package.json` scripts `typecheck-client='tsc --project ./src/tsconfig.json --noEmit --skipLibCheck'`; deps `typescript=npm:@typescript/typescript6@^6.0.2`; `.eslint-plugin-local` filenames only (`code-no-any-casts.ts`, `code-no-dangerous-type-assertions.ts` — contents not opened).

TypeScript: `packages/typescript/tsconfig.base.json` — `'strict: true', 'exactOptionalPropertyTypes: true', 'target: es2022', 'verbatimModuleSyntax: true'`; `tsconfig.json` — `'isolatedDeclarations: true', 'declaration: true'` (single-repo: microsoft/TypeScript); scripts `lint='hereby lint', test='hereby test', build='hereby build'`; `go.work`, `.golangci.yml` present (single-repo).

angular: `packages/tsconfig.json` — `"noImplicitAny": true, "noImplicitOverride": true, "noImplicitReturns": true, "module": "esnext", "target": "es2020"` (no `"strict": true` key seen); `coding-standards.md:80-85` 'Avoid `any` where possible. If you find yourself using `any`, consider whether a generic or `unknown` may be appropriate'; `:198-201` 'Do not prefix interfaces with `I`.' (single-repo: angular/angular); lint `pnpm --silent tslint && pnpm --silent ng-dev format changed --check`; no root eslint config seen — `tslint.json` at root (single-repo).

next.js: root `tsconfig.json` `"strict": false`; `packages/next/tsconfig.json` `"strict": true, "verbatimModuleSyntax": true`; `test/lib/tsconfig.json` `"strictNullChecks": true`; 325 `tsconfig.json` files (single-repo counts: vercel/next.js); scripts `"test-types": "tsc", "typescript": "tsc --noEmit", "lint-typescript": "turbo run typescript"`; `eslint.config.mjs:456 '@next/internal/no-as-any': 'error'` (grep-verified).

## 5) Rules for an AI using this skill

- Use `type(scope): summary` with an observed type — cite: angular guideline `build|ci|docs|feat|fix|perf|refactor|test` (angular/angular, `commit-message-guidelines.md:36`) and vscode `fix(agentHost): allowlist WORKTREE_META_GIT_LFS_POINTER_FILES in the ownership guard (#350515)` (microsoft/vscode, /172752).
- Put the issue/PR number in the subject where the repo's subjects do — cite: TypeScript `fix(65682): preserve export bindings in commonjs postfix updates (#65701)` (microsoft/TypeScript, 1000-sample) and vscode `perf: reduce memory usage by 44 kB (#342392)` (microsoft/vscode, /172752).
- Prefix reverts as `Revert "<original subject>"` — cite: TypeScript `Revert "Report cyclic structures and truncation during declaration emit" (#65567)` (microsoft/TypeScript, 1000-sample) and angular `Revert "build: update rust dependencies"` (angular/angular, /39508).
- Replace `any`/`as any` with `unknown`, a generic, or a precise type instead of adding new `any` — cite: angular `replace `any` with `unknown`` `b10021c79b` (angular/angular, /39508) and next.js `Remove unnecessary `as any` casts (#100418)` (vercel/next.js, /5000).
- Require a reason to disable the `as any` lint rule; do not silently cast — cite: next.js `e12bdb87ad Lint against new `as any` casts and require a reason to disable it (#101255)` (vercel/next.js, /5000) and `eslint.config.mjs:456 '@next/internal/no-as-any': 'error'` (vercel/next.js, HEAD).
- Set `strict: true` only at the scoped config level the repo actually uses; never assume the root config is strict — cite: next.js root `"strict": false` vs `packages/next "strict": true` (vercel/next.js, HEAD) and vscode `src/tsconfig.base.json "strict": true` (microsoft/vscode, HEAD).
- Where no root `strict` key exists, enable the strict-adjacent flags the repo names — cite: angular `packages/tsconfig.json "noImplicitAny": true, "noImplicitOverride": true, "noImplicitReturns": true` with no `"strict": true` key seen (angular/angular, HEAD).
- Do not prefix interfaces with `I` or suffix them with `Interface` (single-repo: angular/angular) — cite: `coding-standards.md:198-201 'Do not prefix interfaces with `I`.'` (angular/angular, /39508).
- Run the repo's own typecheck script before claiming a change compiles — cite: vscode `typecheck-client='tsc --project ./src/tsconfig.json --noEmit --skipLibCheck'` (microsoft/vscode, HEAD `package.json`) and next.js `"typescript": "tsc --noEmit"` (vercel/next.js, HEAD `package.json`).
- Label any rule drawn from one repo as single-repo and do not export it — cite: vscode `debt` first-word 1525 (single-repo: microsoft/vscode, /172752) and TypeScript `[api] 61/1000` (single-repo: microsoft/TypeScript, 1000-sample).

## 6) What was NOT observed / limits

No TS type-inference practice: vscode `inference 9`/172752 are AI/gRPC (`fc067afe8e1 Merge pull request #225098 from cobey/cobey/add-azure-ai-inference`); next.js 3/5000, 5/37067; TypeScript 6/1000 — critic: 'Too sparse/non-TS to support any TS inference claim.'

No `any`/`unknown`/`generic` practice from vscode subject counts: `any 410` word-boundary hits are mostly English ('at any location'); critic EXCLUDE applies.

No universal `strict: true`: contradicted by next.js root `strict:false` and angular's missing `strict` key (critic [a]).

No cross-repo `strictNullChecks` practice: vscode 17 subjects, next.js only in `test/lib/tsconfig.json`, TypeScript `strict` word 1/1000.

No eslint rule semantics beyond filenames (vscode, contents not opened) and one grep line (next.js:456); vscode CONTRIBUTING typescript grep returned no lines.

Not full history: TypeScript bound to 1000 subjects; next.js detail bound to 5000/37067; angular `chore 0` in recent 5000 vs 1099 all-history — quoted chore examples are older. Subjects only; no diff-level verification in any repo.
