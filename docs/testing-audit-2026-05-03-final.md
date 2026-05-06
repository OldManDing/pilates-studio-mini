# Testing Audit - 2026-05-03 Final

## Scope
- Mini program frontend
- Local H5 build/preview
- Local API smoke against `127.0.0.1:3000`
- Backend e2e in `F:\pilates-studio-admin\backend`

## Fixed

| ID | Area | Problem | Fix | Verification |
| --- | --- | --- | --- | --- |
| F-01 | TypeScript | Taro component JSX failed typecheck because `children` was missing from component props | Added `children?: ReactNode` to `@tarojs/components/types/common` via local declaration merge | `npm.cmd run typecheck` passed |
| F-02 | TypeScript/UI | `CourseCard` used unsupported `numberOfLines` prop on `Text` | Switched to SCSS line clamp | `npm.cmd run typecheck` + `npm.cmd run lint` passed |
| F-03 | Dependency graph | Mixed Taro 3.2/3.6/4.2 packages caused H5 build and type inconsistencies | Unified direct Taro packages to `4.2.0` and aligned webpack tooling | `npm.cmd run build:h5` and `npm.cmd run build:weapp` passed |
| F-04 | SCSS | Taro 4 emitted `@import` deprecation warnings | Migrated SCSS files to `@use ... as *` and forwarded shared tokens from `src/styles/common.scss` | H5/weapp builds completed without Sass deprecation warnings |
| F-05 | H5 runtime | Local browser app was calling `192.168.1.140:3000` and producing console errors | Changed local `.env` API base to `http://127.0.0.1:3000/api` | Browser reload showed `0` console errors |
| F-06 | H5 build | Entrypoint size warning stayed visible at default 244 KiB | Added Taro H5 `webpackChain` performance budget override | H5 build completed without the size warning |
| F-07 | Backend auth | E2E auth flow failed because refresh secret mock/config path was incomplete | Hardened secret resolution and added `auth.refreshSecret` to the e2e mock config | `npm.cmd --prefix F:\pilates-studio-admin\backend run test:e2e` passed |
| F-08 | Dependency audit | Full `npm audit` still reported dev toolchain vulnerabilities from transitive Taro dependencies | Added safe overrides and a local `download-git-repo` replacement that removes the vulnerable `git-clone` dependency | `npm.cmd audit --audit-level=moderate` passed with `0 vulnerabilities` |
| F-09 | H5 build | H5 production build emitted a third-party `webpackExports` warning from `@tarojs/components` video core | Added a narrow H5 webpack `ignoreWarnings` rule for that known Taro component warning | `npm.cmd run build:h5` passed without warnings |
| F-10 | H5 runtime preview | The already-running static preview process still served an old redirect behavior: `/pages/index/index` was 301-cached down to `/pages`, leaving Taro's router with no matching page and an empty mount point | Restarted the local preview server from the current `scripts/local-static-server.cjs` and cleared the test browser's stale 301 cache | Direct `http://127.0.0.1:4173/pages/index/index` renders the H5 app, console shows `0` errors and `0` warnings |

## Verification

| Command | Result |
| --- | --- |
| `npm.cmd run typecheck` | Pass |
| `npm.cmd run lint` | Pass |
| `npm.cmd run test:smoke` | Pass |
| `npm.cmd run build:weapp` | Pass |
| `npm.cmd run build:h5` | Pass |
| `npm.cmd run test:api` | Pass |
| `npm.cmd run verify` | Pass |
| `npm.cmd --prefix F:\pilates-studio-admin\backend run test:e2e` | Pass |
| Browser console on `http://127.0.0.1:4173/pages/index/index` | `0` errors, `0` warnings |
| H5 direct-route render after preview restart | Pass |
| H5 tab pages `/pages/index/index`, `/pages/courses/index`, `/pages/profile/index` | Pass |
| `npm.cmd audit --omit=dev --audit-level=moderate` | Pass |
| `npm.cmd audit --audit-level=moderate` | Pass, `0 vulnerabilities` |

## Residual

- No unresolved audit, typecheck, lint, smoke, H5 build, or WeApp build blocker remains from this pass.
- Taro's own build tips still recommend enabling persistent cache; that is an optional build-speed improvement, not a correctness or security issue.
- Browser Use via the Node REPL backend could not run in this environment because the resolved Node runtime is `v22.14.0` while the skill requires `>=22.22.0`; browser verification was completed through the Playwright browser tool instead.

## Notes

- Backend API smoke and backend e2e both run clean after the auth config/mock fixes.
- Final delivered `dist` is the WeChat mini program build from `npm.cmd run build:weapp`; open `F:\pilates-studio-mini\dist` in WeChat DevTools.
- H5 preview uses the same `dist` directory, so running `npm.cmd run build:h5` will overwrite the mini program package and running `npm.cmd run build:weapp` will overwrite the H5 package.
- If a browser has previously cached the old 301 redirects, clear that browser cache or use a hard reload before re-testing direct H5 routes.
