# 小程序右上角原生按钮避让闭环记录（2026-05-04）

## 本轮范围

- 小程序 `navigationStyle: custom` 下，右上角微信原生胶囊按钮可能覆盖自定义顶部设计。
- 本轮只处理 UI 顶部区域、按钮、布局、样式避让问题，不替代接口和业务流程验收。

## 新增发现问题清单

| ID | 问题 | 是否复现 | 根因 | 状态 |
|---|---|---|---|---|
| UI-CAPSULE-001 | `PageHeader` 顶部区域只有存在右侧操作时才注入胶囊区右侧预留，只有返回按钮的子页面没有统一遵守顶部避让规则 | 已通过代码路径复现 | `PageHeader` 的 `topStyle` 被 `rightContent` 条件限制，顶部区域没有形成统一胶囊避让约束 | 已解决 |
| UI-CAPSULE-002 | 通知页右上角“全部已读”按钮在极小屏或文案变长时存在换行后挤压顶部区域的风险 | 已通过样式检查复现风险 | 右侧动作按钮未设置 `max-width` 和 `white-space: nowrap`，依赖内容自然宽度 | 已解决 |
| UI-CAPSULE-003 | 顶部区域整体偏上，只做横向避让后仍不符合小程序右上角原生按钮的垂直空间 | 已通过代码路径复现 | `PageShell` 只使用 `safe-area-inset-top`，没有按 `getMenuButtonBoundingClientRect().bottom` 计算自定义导航内容起点 | 已解决 |

## 已解决问题清单

### UI-CAPSULE-001

- 复现方式：检查 `src/components/shell/PageHeader/index.tsx`，`topStyle` 只有 `capsuleAvoidanceWidth && rightContent` 时生效。
- 根因：胶囊避让是顶部区域的全局约束，不应只绑定右侧操作存在与否。
- 修改文件：
  - `src/components/shell/PageHeader/index.tsx`
  - `src/components/shell/PageHeader/index.scss`
- 修复方式：`PageHeader` 只要顶部行存在并能获取胶囊宽度，就注入 `paddingRight`；右侧容器补 `min-width: 0` 与 `max-width: 100%`。
- 为什么这样改：保留自定义返回按钮的视觉结构，同时保证顶部行不会把右侧内容布局到微信原生胶囊区。
- 复测：
  - `npm.cmd run verify` 通过
  - `build:weapp` 已重新生成 `dist`
  - `verify-weapp-dist` 通过，确认 18 个页面输出存在
- 影响范围：所有使用 `PageHeader` 的子页面；不改业务逻辑、不改接口、不改路由。
- 当前状态：已解决。

### UI-CAPSULE-002

- 复现方式：检查 `src/pages/notifications/index.scss`，通知页顶部动作按钮未限制换行和最大宽度。
- 根因：按钮本身可以随文案增长，极小屏下会挤压 `PageHeader` 顶部行。
- 修改文件：
  - `src/pages/notifications/index.scss`
- 修复方式：通知页头部动作按钮增加 `max-width: 100%` 和 `white-space: nowrap`。
- 为什么这样改：保持参考图中“全部已读”单行轻量动作，不让按钮高度变化破坏胶囊避让空间。
- 复测：
  - `npm.cmd run verify` 通过
  - 生成后 `dist/pages/notifications/index.wxss` 已包含 `white-space:nowrap` 与 `max-width:100%`
- 影响范围：仅通知页顶部动作按钮；不影响消息列表点击、标记已读接口和分页逻辑。
- 当前状态：已解决。

### UI-CAPSULE-003

- 复现方式：检查 `src/components/shell/PageShell/index.scss`，页面顶部只使用 `env(safe-area-inset-top)`；但微信右上角胶囊的底部位置通常低于普通 safe-area。
- 根因：自定义导航场景需要按微信胶囊按钮实际 `bottom` 统一计算内容起点，只做右侧宽度避让会导致整体顶部布局仍偏上。
- 修改文件：
  - `src/utils/ui.ts`
  - `src/components/shell/PageShell/index.tsx`
  - `src/pages/course-detail/index.tsx`
  - `src/pages/coach-detail/index.tsx`
- 修复方式：新增 `getMiniPageTopInset()`，优先使用 `getMenuButtonBoundingClientRect().bottom + 12px` 作为页面顶部内容起点；通用 `PageShell` 统一注入 `paddingTop`。课程详情、教练详情成功态绕过 `PageShell`，已单独接入同一计算。
- 为什么这样改：顶部区域整体下移必须按小程序原生胶囊的垂直位置计算，不能继续依赖固定 padding 或逐页手调。
- 复测：
  - `npm.cmd run typecheck` 通过
  - `npm.cmd run lint` 通过
  - `npm.cmd run verify` 通过
  - 生成后 `dist/common.js`、`dist/pages/course-detail/index.js`、`dist/pages/coach-detail/index.js` 已包含新的 `paddingTop` 注入逻辑
- 影响范围：所有 `PageShell` 页面，以及课程详情、教练详情成功态；不改接口、不改业务状态流转。
- 当前状态：已解决。

## 仍未解决问题清单

| ID | 当前卡点 | 状态 |
|---|---|---|
| 无 | 本轮范围内没有未解决项 | 已清零 |

## 之前漏查最严重的模块/流程

- 漏查最严重的是“小程序自定义导航顶部区域”和“带右侧动作的页面头部”。
- 之前更多关注了 H5/普通布局和按钮视觉，没有把微信原生胶囊按钮作为强约束逐项纳入检查。

## 验证记录

- 初次执行 `npm run verify` 被 PowerShell 执行策略拦截，属于本机 `npm.ps1` 限制，不是项目错误。
- 改用 `npm.cmd run verify` 后完整通过：
  - `tsc --noEmit`
  - `eslint src`
  - `node scripts/smoke-tests.cjs`
  - `taro build --type weapp`
  - `node scripts/verify-weapp-dist.cjs`
- `dist` 已重编，关键产物时间更新为 2026-05-04 21:32:45：
  - `dist/app.json`
  - `dist/common.js`
  - `dist/pages/course-detail/index.js`
  - `dist/pages/coach-detail/index.js`

## 下一步最优先处理项

- 在微信开发者工具模拟器中重新打开 `F:\pilates-studio-mini\dist`，重点看首页、预约页、通知页、设置页的顶部区域是否和右上角原生胶囊按钮保持间距。
- 如果实机发现个别机型仍偏挤，下一步应把 `getMenuButtonBoundingClientRect()` 的 `top/bottom` 也纳入自定义导航高度计算，而不是继续单独调页面 padding。

## 当前是否达到可上线标准

- 本轮“右上角原生按钮避让”范围：达到可上线标准。
- 整个小程序全功能/全接口是否可上线：本轮未重新执行全量接口矩阵和全按钮点击矩阵，不能用本轮结论替代整体验收。
