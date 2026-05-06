# 小程序 UI 视觉审计与修复闭环（2026-05-04）

## 范围

- 本轮只处理小程序 UI 视觉与可见提示问题，不混入接口/业务流程测试。
- 检查维度：按钮、布局、字体、样式残留、提示中文化、`dist` 小程序产物同步。
- 执行方式：当前会话未暴露 `codex-openagent-debugging` 技能入口，按可用的 `Systematic Debugging` 闭环执行：复现问题、定位根因、实施修复、立即复测、检查相关链路。

## 本轮新增发现问题清单

| ID | 级别 | 问题 | 是否复现 | 根因 | 修复文件 | 验证 | 状态 |
|---|---|---|---|---|---|---|---|
| UI4-001 | P1 | 教练列表页仍显示英文眉注 `COACHES`、`TEAM` | 已复现：源码与旧 `dist` 均可检索到 | 早期 Figma 风格英文眉注未随中文化收口 | `src/pages/coaches/index.tsx` | 源码可见字段扫描无残留；`build:weapp` 后 dist 可见字段扫描无残留 | 已解决 |
| UI4-002 | P1 | 消费记录页仍显示 `ACTIVITY`、`SUMMARY`、`LEDGER` | 已复现 | 交易页页头/分区眉注仍沿用英文标签 | `src/pages/transactions/index.tsx` | 同上 | 已解决 |
| UI4-003 | P1 | 教练详情页近期排课分区显示 `SCHEDULE` | 已复现 | 详情页分区眉注未统一中文 | `src/pages/coach-detail/index.tsx` | 同上 | 已解决 |
| UI4-004 | P1 | 课程详情页信息分区显示 `INSTRUCTOR`、`ABOUT` | 已复现 | 课程详情页直接文本节点仍保留英文分区标签 | `src/pages/course-detail/index.tsx` | 同上 | 已解决 |
| UI4-005 | P1 | 会员中心显示 `BENEFITS`、`OVERVIEW`、`TOTAL`、`ACTIVITY` | 已复现 | 会员页 section-en / overview 标签未中文化 | `src/pages/membership/index.tsx` | 同上 | 已解决 |
| UI4-006 | P1 | 我的教练页显示 `COACH TEAM`、`FAVORITES` | 已复现 | hero 标签与 SectionTitle 右侧角标仍为英文 | `src/pages/my-coaches/index.tsx` | 同上 | 已解决 |
| UI4-007 | P1 | 帮助页显示 `FEEDBACK`、`CONTACT` | 已复现 | 分区右侧角标未中文化 | `src/pages/help/index.tsx` | 同上 | 已解决 |
| UI4-008 | P1 | 消息通知页显示 `UNREAD`、`EARLIER` | 已复现 | 未读/已读分区角标仍为英文 | `src/pages/notifications/index.tsx` | 同上 | 已解决 |
| UI4-009 | P1 | 续费、训练记录、账户安全页显示 `PLANS`、`TRAINING`、`PROTECT` | 已复现 | 同类 SectionTitle 角标漏查 | `src/pages/membership-renew/index.tsx`、`src/pages/training-records/index.tsx`、`src/pages/account-security/index.tsx` | 同上 | 已解决 |
| UI4-010 | P1 | 用户协议/隐私政策页显示 `TERMS`、`PRIVACY`、`POLICY` | 已复现 | 法律页 hero 标签和章节角标仍为英文 | `src/pages/agreement/index.tsx`、`src/pages/privacy/index.tsx` | 同上 | 已解决 |
| UI4-011 | P1 | 设置页“关于”分区仍显示 `ABOUT` | 已复现 | 设置页分区 label 漏查 | `src/pages/settings/index.tsx` | 同上 | 已解决 |
| UI4-012 | P1 | `dist` 仍包含旧首页英文 UI 标签，微信开发者工具打开会看到旧产物 | 已复现：修复前 `dist` 中可检索到旧构建标签 | 源码已有部分中文化，但小程序 `dist` 未重新编译 | `dist/**` 由 `npm.cmd run build:weapp` 重新生成 | `npm.cmd run verify:weapp-dist` 通过，确认 18 个页面；dist 时间更新到 2026-05-04 07:06 | 已解决 |
| UI4-013 | P2 | smoke 脚本仍断言旧的英文变量提示，导致中文化验证无法闭环 | 已复现：`npm.cmd run test:smoke` 先后报缺少 `API_BASE_URL...`、`本地 API 地址` | 验证脚本断言未随运行文案中文化同步 | `scripts/smoke-tests.cjs` | `npm.cmd run test:smoke` 通过 | 已解决 |

## 已解决问题清单

- 已清理源码中所有可见英文 `eyebrow` / `actionLabel`。
- 已清理源码中直接渲染的全大写英文标签。
- 已重新编译微信小程序 `dist`，不再使用旧 H5 或旧小程序产物。
- 已修正 smoke 脚本中过期的提示文案断言。

## 仍未解决问题清单

- 本轮范围内没有仍未解决的可复现项。

## 未解决问题当前卡点

- 无本轮卡点。
- 说明：本轮没有自动化微信开发者工具模拟器截图，也没有真机矩阵截图；因此不能把“源码与 dist 文案清零”扩大解释为“所有真实设备视觉完全无问题”。

## 之前漏查最严重的模块/流程

- 漏查最严重的是跨页面的装饰性角标：`SectionTitle.actionLabel`、`PageHeader.eyebrow`、hero label、section-en。
- 旧 `dist` 与源码不同步也属于严重漏查点；用户打开 `F:\pilates-studio-mini\dist` 时看到的是产物，不是源码。
- 法律页、会员中心、课程/教练详情页的直接文本节点比常规 PageHeader/SectionTitle 更容易被漏掉。

## 验证记录

| 命令 | 结果 |
|---|---|
| `npm.cmd run typecheck` | 通过 |
| `npm.cmd run build:weapp` | 通过，已清理并重新生成 `dist` |
| `npm.cmd run verify:weapp-dist` | 通过，确认 18 个小程序页面 |
| `npm.cmd run test:smoke` | 通过 |
| `rg -n "actionLabel='[A-Z]\|eyebrow='[A-Z]" src/pages src/components src/custom-tab-bar` | 无匹配 |
| `rg -n '>[A-Z][A-Z0-9 ]*<' src/pages src/components src/custom-tab-bar` | 无匹配 |
| `rg -n 'eyebrow:"(...)"\|actionLabel:"(...)"\|children:"(...)"' dist/pages` | 无可见英文 UI 标签匹配 |

## 下一步最优先处理项

1. 在微信开发者工具中打开 `F:\pilates-studio-mini\dist`，对首页、预约、课程详情、会员、我的、设置、帮助、协议/隐私页做模拟器截图复核。
2. 重点看小屏、长文案、系统字体放大、底部 tabbar 遮挡和法律页长内容滚动。
3. 如果截图发现按钮、布局、字体、样式问题，再按同样闭环逐项修复。

## 当前是否达到可上线标准

- 达到本轮“源码可见英文标签清零、中文提示断言对齐、dist 小程序产物已重编”的门禁。
- 未完成微信开发者工具模拟器截图和真机矩阵，因此不能下完整上线结论。
