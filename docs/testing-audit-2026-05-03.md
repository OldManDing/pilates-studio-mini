# Pilates Studio Mini 测试审计与修复清单

日期：2026-05-03  
项目：Taro 3.6 + React 18 + TypeScript + SCSS 小程序前端

## 测试范围

- 技术栈与脚本识别：`package.json`、Taro 配置、页面注册、导航配置、现有 smoke 脚本。
- 静态质量：TypeScript、ESLint、Taro Doctor、源码风险关键字扫描。
- 构建验证：微信小程序构建、H5 构建、跨端 `dist` 产物切换。
- API 联调：`scripts/api-smoke.cjs` 对本机 `http://127.0.0.1:3000/api` 后端执行读接口和受控流程检查。
- 浏览器运行时：H5 静态产物本地服务、移动视口首屏、控制台错误、关键 UI 排版。
- 依赖安全：`npm audit --audit-level=moderate` 与非强制 `npm audit fix`。

## 已修复问题

| ID | 严重级别 | 问题 | 证据 | 修复 |
| --- | --- | --- | --- | --- |
| F-01 | 高 | `npm run lint` 原本无法运行，缺少 `eslint-plugin-import`。 | ESLint 报 `Failed to load plugin 'import'`。 | 新增 `eslint-plugin-import` devDependency。 |
| F-02 | 高 | `verify` 未包含 lint，源码风格/潜在错误不会进入主质量门禁。 | `package.json` 原 `verify` 只跑 typecheck、smoke、weapp build。 | 新增 `lint` 脚本，并把 `npm run lint` 纳入 `verify`。 |
| F-03 | 中 | 源码存在 lint error/warning：import 顺序、变量遮蔽、JSX 缩进、未使用导入、class 成员顺序。 | `npx eslint src --ext .ts,.tsx` 首轮 7 errors / 9 warnings。 | 清理相关 TS/TSX 文件，最终 lint 0 error / 0 warning。 |
| F-04 | 高 | H5 构建后再构建微信小程序会复用同一个 `dist`，触发 `ENOENT dist/pages/coaches/index.js`。 | `npm run verify` 在 `build:weapp` 阶段失败。 | 新增 `scripts/clean-dist.cjs`，并为各平台 `build:*` 增加 `prebuild:*` 清理。 |
| F-05 | 高 | H5 构建“成功”但缺少 `dist/index.html`，产物无法直接作为网页打开。 | `build:h5` 后 `dist` 只有 `js/css/chunk/assets`。 | 新增 `src/index.html`，Taro H5 插件现在能输出 `dist/index.html`。 |
| F-06 | 高 | H5 运行时报 `Taro.getTabBar is not a function`。 | 浏览器控制台报错来自 `syncCustomTabBarSelected`。 | `src/utils/tabbar.ts` 增加能力判断，H5 环境自动跳过小程序专用 API。 |
| F-07 | 高 | H5 手机视口首页会员卡标题被挤成逐字竖排。 | 390x844 截图中会员卡左侧标题区宽度为 0。 | 限定会员卡状态按钮 `width: auto; flex: 0 0 auto`，恢复标题区宽度。 |
| F-08 | 中 | smoke 测试只做字符串断言，缺少页面/导航/资源一致性检查。 | 原脚本不验证页面目录、SCSS、tab 图标真实存在。 | 增加页面注册、页面文件、SCSS、tab 导航目标、tab 图标资源、质量脚本断言。 |
| F-09 | 中 | 非强制依赖修复未执行。 | 初始 `npm audit` 为 73 vulnerabilities。 | 执行 `npm audit fix`，降至 72 vulnerabilities；未使用 `--force`。 |

## 剩余问题与建议

| ID | 严重级别 | 状态 | 问题 | 建议 |
| --- | --- | --- | --- | --- |
| R-01 | 高 | 未修复 | `npm audit` 仍有 72 个漏洞，主要来自 Taro 3.6 依赖链；14 critical、15 high。 | 需要单独做 Taro 4.x 升级评估，不能在本轮直接 `npm audit fix --force`，否则会引入破坏性依赖变更。 |
| R-02 | 中 | 未修复 | H5 构建仍有入口体积警告：`app` 入口 322 KiB，超过 244 KiB 建议值。 | 后续按页面级分包、懒加载、减少首页同步依赖处理。 |
| R-03 | 中 | 未修复 | `taro doctor` 仍提示缺少常见测试依赖，项目没有 Jest/Mocha/Vitest 单元覆盖率。 | 建议新增单元测试框架和覆盖率门禁，优先覆盖 API normalize、鉴权降级、日期/权益计算。 |
| R-04 | 中 | 未修复 | `taro doctor` 内置 ESLint 对 React 18 automatic JSX runtime 不完全匹配，会报大量 `React must be in scope`。 | 以项目 `npm run lint` 作为实际质量门禁；升级 Taro/doctor 后再复核。 |
| R-05 | 低 | 未修复 | PowerShell 不能直接执行 `npm.ps1`，需要用 `npm.cmd`。 | 本机执行策略问题；文档或脚本里建议 Windows PowerShell 使用 `npm.cmd`。 |

## 最终验证结果

| 命令/检查 | 结果 | 备注 |
| --- | --- | --- |
| `npm.cmd run typecheck` | 通过 | TypeScript strict 检查通过。 |
| `npm.cmd run lint` | 通过 | 0 error / 0 warning。 |
| `npm.cmd run test:smoke` | 通过 | 已包含页面/导航/资源/脚本一致性检查。 |
| `npm.cmd run verify` | 通过 | typecheck + lint + smoke + clean dist + weapp build。 |
| `npm.cmd run test:api` | 通过 | 本机后端 API smoke passed。 |
| `npm.cmd run build:h5` | 通过，1 warning | `dist/index.html` 已生成；仍有入口体积 warning。 |
| H5 浏览器移动视口 | 通过 | `http://127.0.0.1:4173`，390x844，控制台 0 error / 0 warning。 |
| `npm.cmd audit --audit-level=moderate` | 未通过 | 仍有 72 个依赖漏洞，需要升级专项。 |

## 回归重点

- 每次切换 `build:h5` / `build:weapp` 后确认 `prebuild:*` 清理生效。
- 首页 H5 手机视口检查会员卡、今日课程卡、底部 tab 是否挤压或竖排。
- 新增页面时必须同时更新 `src/app.config.ts`、页面 `.tsx/.scss`、必要导航资源，`test:smoke` 会拦截不一致。
- Taro 4.x 升级前不要执行 `npm audit fix --force` 直接落库。
