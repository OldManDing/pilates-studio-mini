# 阶段二：后台全界面测试 Bug 单

> 测试目标：覆盖 Umi + Ant Design 管理后台主界面、登录态、数据加载、API 错误、控制台错误与构建验证。

## 测试环境

| 项目 | 内容 |
| --- | --- |
| 测试时间 | 2026-04-28 |
| 后台仓库 | `F:\pilates-studio-admin` |
| 后台地址 | `http://127.0.0.1:8000` |
| 后端 API | `http://127.0.0.1:3000/api` |
| 登录账号 | `admin@pilates.com / Admin123!` |

## 已执行验证

| 类型 | 命令/方式 | 结果 |
| --- | --- | --- |
| 后台 TypeScript | `cmd /c npm run typecheck` | Passed |
| 后台 smoke | `cmd /c npm run smoke-test` | Passed，11 个测试文件 / 11 个测试通过；jsdom pseudo-elements 提示不影响结果 |
| 后台生产构建 | `cmd /c npm run build` | Passed |
| 浏览器登录 | Playwright 登录后台 | Passed |
| 主路由巡检 | Playwright 检查 10 个主路由 | Passed，无 4xx/5xx API、无 console error、无可见错误 |

## 页面覆盖清单

| 页面 | 路由 | 覆盖点 | 本轮结果 |
| --- | --- | --- | --- |
| 登录 | `/login` | 登录表单、会话进入后台 | Passed |
| 仪表盘 | `/dashboard` | 总览、今日动态、预约/课程概览 | Passed |
| 会员管理 | `/members` | 会员列表数据、分页响应 | Passed |
| 课程管理 | `/courses` | 课程列表与排期入口 | Passed |
| 预约管理 | `/bookings` | 预约列表、统计请求、签到/状态入口 | Passed |
| 教练管理 | `/coaches` | 教练列表、评分字段、详情入口 | Passed |
| 财务报表 | `/finance` | KPI、交易与财务数据 | Passed |
| 数据分析 | `/analytics` | 图表/趋势页面加载 | Passed |
| 通知管理 | `/notifications` | 通知/反馈列表加载 | Passed |
| 系统设置 | `/settings` | 门店/通知/安全配置页面 | Passed |
| 角色权限 | `/roles` | 权限矩阵页面 | Passed |

## Bug 列表

| ID | 状态 | 严重级别 | 页面/流程 | 复现步骤 | 实际结果 | 期望结果 | 关联文件 | 修复说明 | 回归结果 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ADM-001 | Verified | High | 会员/预约/场次列表分页响应 | 进入会员、预约或场次相关页面 | 前端列表服务曾丢失 `meta`，页面可能显示为空或分页异常 | 列表数据和分页 meta 正常 | `src/services/members.ts`、`src/services/bookings.ts`、`src/services/courseSessions.ts` | 已改用 `requestWithMeta` 保留分页响应 | typecheck、smoke、build、浏览器主路由巡检通过 |
| ADM-002 | Verified | High | 教练列表评分与分页 | 进入 `/coaches` | 教练列表曾因响应映射和评分字符串导致显示异常 | 教练列表与平均评分正常显示 | `src/services/coaches.ts` | 已改用 `requestWithMeta` 并归一化 `rating` 为 number | typecheck、smoke、build、浏览器 `/coaches` 巡检通过 |
| ADM-003 | Verified | Medium | 后台 CRUD 弹窗表单挂载 | 登录后台后分别点击 `/members` 新增会员、`/courses` 新增课程、`/bookings` 新增预约、`/coaches` 新增教练 | 弹窗能打开，但 console 出现 Ant Design `useForm` 未连接 Form 警告 | 弹窗打开无 console warning/error | `src/pages/members/index.tsx`、`src/pages/courses/index.tsx`、`src/pages/bookings/index.tsx`、`src/pages/coaches/index.tsx` | 已给 4 个包含 `Form.useForm()` 的 CRUD Modal 增加 `forceRender` | LSP/typecheck 通过；Playwright 复测 4 个新增弹窗 `modalCount=1` 且 consoleErrors 为空 |

## 未覆盖 / 人工复测项

- 本轮未逐个提交所有后台表单的破坏性操作，避免污染当前演示数据。
- 生产权限矩阵、不同角色账号、真实上传/邮件/短信等外部依赖未覆盖。
