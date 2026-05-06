# WeApp Dist Closure Audit - 2026-05-03

## Scope Rechecked

- Pages: 18 registered pages in `src/app.config.ts`; generated `dist/app.json` also contains 18 pages.
- Modules and entries: tab bar, profile menu, settings menu, course/coach/detail navigation, membership renewal, bookings, notifications, help feedback.
- Core flows: mini login, profile, memberships, course sessions, coach detail, bookings, transactions, notifications, membership plans.
- State coverage: loading, empty, load failure, retry, pagination, guarded submit, duplicate-submit prevention, unauthorized recovery.
- Interfaces: local read-only API smoke against `http://127.0.0.1:3000/api`; backend e2e for mini user/member and auth/member/booking.
- Build artifacts: final `dist` must be WeChat mini program output, not H5 output.

## New Issues Found And Closed

| ID | Status | Reproduced | Root Cause | Files Changed | Verification |
| --- | --- | --- | --- | --- | --- |
| W-01 | Resolved | Yes. `npm run verify:weapp-dist` failed with `dist/app.json is missing`; `dist` contained `index.html`, `js`, `css`, `chunk`. | Taro H5 and weapp builds share `outputRoot: dist`; the previous final artifact was overwritten by an H5 build. There was no artifact-type gate. | `package.json`, `scripts/verify-weapp-dist.cjs` | `npm run build:weapp` then `npm run verify:weapp-dist` passed: `WeChat mini program dist verified: 18 pages`. Final `dist` has `app.json` and no `index.html`. |
| W-02 | Resolved | Yes. `npx taro doctor` failed with `NoFilesFoundError` on `F:\pilates-studio-mini\src\**\*.{js,ts,jsx,tsx}`. | `@tarojs/plugin-doctor@0.0.13` passes an absolute Windows brace glob directly to ESLint; ESLint cannot expand that pattern. | `package.json`, `package-lock.json`, `eslint.config.js`, `scripts/patch-taro-doctor.cjs`, `scripts/smoke-tests.cjs` | `node scripts/patch-taro-doctor.cjs` applied the patch; `npx taro doctor` now reaches ESLint and reports `Eslint 检查通过`; `npm run lint` and `npm run test:smoke` also passed. |

## False Positives Rechecked

| Check | Result | Evidence |
| --- | --- | --- |
| Component Chinese text looked garbled in PowerShell output | Not an application issue | Node UTF-8 reads showed `Empty`, `Loading`, and `LoadMoreFooter` contain correct Chinese text and failure-state checks. |
| Course list failure state seemed to lack retry | Not an issue | `src/pages/courses/index.tsx` renders `重新加载` button calling `fetchCourses` when `loadFailed` is true. |

## Final Verification

| Gate | Result |
| --- | --- |
| `npm run typecheck` | Pass |
| `npm run lint` | Pass |
| `npm run test:smoke` | Pass |
| `npm run verify` | Pass; includes typecheck, lint, smoke, weapp build, weapp dist verification |
| `npm run test:api` | Pass |
| `npm audit --audit-level=moderate` | Pass, 0 vulnerabilities |
| `npx taro doctor` | Pass command; non-blocking warnings remain for using npm scripts and missing Jest/Mocha-style test dependency |
| Backend `npm --prefix F:\pilates-studio-admin\backend run test:e2e` | Pass, 2 suites / 2 tests |
| Final `dist` type | WeChat mini program: `app.json` present, `index.html` absent, 18 pages, custom tab bar present |

## Remaining Items

- Blocking unresolved issues: none found in this pass.
- Non-blocking recommendations:
  - Add a frontend unit test runner such as Jest/Vitest later if coverage metrics are required.
  - Enable Taro persistent cache later for faster repeated builds.
  - Open `F:\pilates-studio-mini\dist` in WeChat DevTools for simulator and real-device visual checks before production upload.

## Most Previously Underchecked Areas

- Build artifact ownership: H5 and weapp both write to `dist`, so the final artifact type must be verified after the last build.
- Tooling health: `taro doctor` was not fully closed before because its Windows glob failure was treated as a warning instead of being reproduced and fixed.
- Mini-program delivery path: H5 preview evidence cannot prove the package opened by WeChat DevTools.

## Release Readiness

Current local mini-program package readiness: pass for build, static consistency, API smoke, backend e2e, audit, and Doctor command execution.

Production upload still requires WeChat DevTools simulator/real-device inspection and production environment values/domain checks.
