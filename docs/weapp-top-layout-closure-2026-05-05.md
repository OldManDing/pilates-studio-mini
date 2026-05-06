# 小程序顶部布局闭环记录（2026-05-05）

## 本轮问题

| ID | 问题 | 是否复现 | 当前状态 |
|---|---|---|---|
| UI-TOP-001 | 首页、预约页为了避开右上角原生胶囊，把整页内容起点压到胶囊底部以下，造成顶部空白过大、布局不自然 | 已通过用户截图和代码路径复现 | 已解决 |
| UI-TOP-002 | 首页日期/会员 badge、预约页“我的预约”属于顶行内容，但未按胶囊右侧区域做独立避让，继续整体下移会牺牲顶部空间 | 已通过代码路径复现 | 已解决 |
| UI-RUNTIME-001 | 重新编译后微信开发者工具自动化页面一度卡在 loading/空白，无法直接形成复测截图 | 已通过 automator 复现 | 已处理，清理编译缓存后恢复 |

## 根因

- `src/utils/ui.ts` 的 `getMiniPageTopInset()` 使用 `getMenuButtonBoundingClientRect().bottom + 12px` 作为整页顶部 padding。
- 这个策略能避免右上角胶囊遮挡，但会把所有内容都推到胶囊下方，首页和预约页顶部形成不必要空白。
- 正确策略应拆成两层：
  - 页面内容起点只按状态栏安全区下移。
  - 处在顶部横向行里的右侧内容，单独按胶囊宽度做 `padding-right` 避让。

## 修复

| 文件 | 改动 |
|---|---|
| `src/utils/ui.ts` | `getMiniPageTopInset()` 改为优先使用 `statusBarHeight + 12px`；新增 `getMiniCapsuleAvoidanceStyle()`，按 `windowWidth - capsuleLeft + extraGap` 计算右侧避让 |
| `src/pages/index/components/HomeHero.tsx` | 首页顶部日期/badge 行注入动态右侧避让 |
| `src/pages/courses/components/BookingHero.tsx` | 预约页顶部 eyebrow/我的预约 行注入动态右侧避让 |
| `src/components/shell/PageHeader/index.tsx` | 通用子页面头部顶行注入动态右侧避让 |
| `src/pages/index/index.scss` | 首页顶部行补 `box-sizing`、宽度约束、日期省略、badge 不压缩 |
| `src/pages/courses/index.scss` | 预约页顶部行补 `box-sizing`、宽度约束、右侧动作单行省略 |
| `src/components/shell/PageHeader/index.scss` | 通用头部顶行补宽度与盒模型约束 |

## 复测证据

- 后台服务确认：
  - `http://127.0.0.1:3000/api/health` 返回 200。
  - `http://127.0.0.1:3000/api/mini-auth/login` 返回 201，并返回 token。
- 开发者工具运行态处理：
  - 初次复测出现 loading/空白。
  - 执行微信开发者工具 `cache --clean compile` 后重新打开项目，页面恢复渲染。
- 首页坐标复测：
  - `.page-shell__inner` `paddingTop = 59px`。
  - `.home-hero__top` `top = 59px`，`paddingRight = 106px`。
  - `.home-hero__title` `top = 90.86px`。
  - loading 已消失，首页真实后端数据已回显。
- 预约页坐标复测：
  - `.page-shell__inner` `paddingTop = 59px`。
  - `.booking-hero__top` `top = 59px`，`paddingRight = 106px`。
  - `.booking-hero__title` `top = 78px`。
  - loading 已消失，课程列表真实后端数据已回显。
- 截图：
  - `docs/wechat-devtools/top-layout-final-2026-05-05T01-15-00/home-final.png`
  - `docs/wechat-devtools/top-layout-final-2026-05-05T01-15-00/courses-final.png`

## 命令验证

| 命令 | 结果 |
|---|---|
| `npm.cmd run typecheck` | 通过 |
| `npm.cmd run lint` | 通过 |
| `npm.cmd run build:weapp` | 通过，已重新生成 `dist` |
| `npm.cmd run verify:weapp-dist` | 通过，确认 18 个小程序页面产物存在 |
| `npm.cmd run test:smoke` | 通过 |

## 影响范围

- 影响页面：
  - 首页
  - 预约页
  - 使用 `PageHeader` 的子页面顶部区域
- 不影响内容：
  - 接口地址
  - 登录逻辑
  - 预约、会员、课程业务状态流转
  - tabBar 路由配置

## 仍未解决问题

| ID | 卡点 | 状态 |
|---|---|---|
| 无 | 本轮“顶部空白 + 胶囊避让”范围内没有遗留未解决项 | 已清零 |

## 当前结论

- 本轮顶部布局问题已解决。
- `dist` 已重新编译，可直接用微信开发者工具打开 `F:\pilates-studio-mini\dist` 对应的小程序产物验证。
- 当前结论只覆盖本轮顶部布局与胶囊避让，不替代全量功能/接口验收。
