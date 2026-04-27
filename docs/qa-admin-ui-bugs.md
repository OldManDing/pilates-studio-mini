# 后台界面与 CRUD 测试 Bug 单

> 阶段二：测试后台所有界面（包括 CRUD 情况）。

## 测试范围

- 登录、仪表盘、会员、课程、排课、教练、预约、财务/交易、通知/反馈、系统设置、角色权限等后台页面。
- 覆盖列表、搜索/筛选、创建、查看、编辑、删除/禁用、状态流转、权限边界、空错加载态。

## 环境与命令记录

| 项目 | 内容 |
| --- | --- |
| 测试时间 | 2026-04-27 |
| 测试环境 | 本地后台 Web / Vitest smoke / TypeScript |
| 验证命令 | `cmd /c npm run typecheck`、`cmd /c npm run smoke-test`、`cmd /c npm run build` |

## Bug 列表

| ID | 状态 | 严重级别 | 页面/流程 | 复现步骤 | 实际结果 | 期望结果 | 关联文件 | 修复提交/说明 | 回归结果 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ADM-001 | Verified | High | 仪表盘 / 预约数据加载 | 启动后端与后台，访问 `http://127.0.0.1:8000`，使用 `admin@pilates.com / Admin123!` 登录进入 `/dashboard` | 控制台出现 `GET http://localhost:3000/api/bookings?page=1&pageSize=200` 400 Bad Request | 仪表盘应能加载预约数据且无 400 API 错误 | `F:\pilates-studio-admin\src\pages\dashboard\index.tsx`、`F:\pilates-studio-admin\backend\src\common\dto\pagination.dto.ts` | 已将仪表盘预约请求和兜底 meta 的 `pageSize` 从 200 调整为后端允许的 100 | 回归通过：后台 typecheck/build 通过，浏览器刷新 `/dashboard` 后请求为 `pageSize=100`，当前控制台 0 error |
| ADM-002 | Verified | High | 预约管理 / 列表加载 | 登录后台后访问 `/bookings` | 请求 `GET /api/bookings?page=1&pageSize=200&from=...&to=...` 返回 400 Bad Request | 预约管理列表应成功加载，无 API 400 | `F:\pilates-studio-admin\src\pages\bookings\index.tsx`、`F:\pilates-studio-admin\backend\src\common\dto\pagination.dto.ts` | 已将统计请求常量 `BOOKING_QUERY_PAGE_SIZE` 从 200 调整为后端允许的 100 | 回归通过：`/bookings` 请求 `pageSize=10` 和 `pageSize=100`，无 400、无控制台错误 |

## 已执行检查

- `cmd /c npm run typecheck`：通过。
- `cmd /c npm run smoke-test`：通过，11 个测试文件 / 11 个测试全部通过；测试日志出现 jsdom 对 pseudo-elements `getComputedStyle()` 的 Not implemented 提示，但未导致失败。
- `cmd /c npm run build`：通过，后台生产构建产物已生成到 `F:\pilates-studio-admin\dist`。
- ADM-001 修复后，`cmd /c npm run typecheck` 与 `cmd /c npm run build` 再次通过。
- ADM-002 修复后，`cmd /c npm run typecheck` 与 `cmd /c npm run build` 再次通过。
- 最终后台回归：`cmd /c npm run typecheck`、`cmd /c npm run smoke-test`、`cmd /c npm run build` 均通过。
- Playwright 浏览器主路由回归：重新登录后依次访问 `/dashboard`、`/members`、`/courses`、`/bookings`、`/coaches`、`/finance`、`/analytics`、`/notifications`、`/settings`、`/roles`，全部无 4xx/5xx API 响应、无控制台 error。

## 阻塞与人工复测项

- 浏览器 E2E 已在本地后台与后端服务启动后完成主路由回归。
- 生产权限/真实账号矩阵：待复测。
