# 小程序 + 后台 + API 联调 CRUD 测试 Bug 单

> 阶段三：测试小程序功能、后台功能与后端 API CRUD 联调。

## 测试范围

- 小程序 API：认证、会员资料、会员卡、课程/场次、预约、取消、签到、续费、通知、反馈、交易、教练。
- 后台 API：管理员登录、会员、课程、场次、预约、教练、财务、通知/反馈、设置、角色权限。
- 联动验证：后台创建/修改数据后小程序可读；小程序提交业务动作后后台可见并可处理。

## 环境与命令记录

| 项目 | 内容 |
| --- | --- |
| 测试时间 | 2026-04-27 |
| 测试环境 | 本地 backend + admin + mini API smoke |
| 验证命令 | `cmd /c npm run test:api` |

## Bug 列表

| ID | 状态 | 严重级别 | 模块/API | 复现步骤 | 实际结果 | 期望结果 | 关联文件 | 修复提交/说明 | 回归结果 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| INT-001 | Verified | High | 小程序 API smoke / 后端可用性 | 在 `F:\pilates-studio-mini` 执行 `cmd /c npm run test:api` | 初次输出 `fetch failed`，无法访问 `http://127.0.0.1:3000/api` | 本地后端可访问，API smoke 能完成 mini-auth、profile、course-sessions 等基础联调 | `F:\pilates-studio-mini\scripts\api-smoke.cjs`、`F:\pilates-studio-admin\backend` | 已启动本地后端服务 PID 24092，确认 `/api/health` 200；数据库迁移无待执行，seed 成功 | 回归通过：`cmd /c npm run test:api` 输出 `API smoke passed` |
| INT-002 | Verified | High | Admin Bookings API | 后台登录进入 `/dashboard` 后请求 `GET /api/bookings?page=1&pageSize=200` | 后端返回 400 Bad Request | 后台仪表盘应能获取预约列表数据 | `F:\pilates-studio-admin\src\pages\dashboard\index.tsx`、`F:\pilates-studio-admin\backend\src\common\dto\pagination.dto.ts` | 已按后端 `@Max(100)` 约束将请求改为 `pageSize=100` | 回归通过：浏览器 `/dashboard` 请求 `GET /api/bookings?page=1&pageSize=100`，当前控制台 0 error |
| INT-003 | Verified | High | Admin Bookings API | 后台访问 `/bookings` 页面 | 请求 `GET /api/bookings?page=1&pageSize=200&from=...&to=...` 返回 400 Bad Request | 后台预约管理应按后端分页约束成功获取列表 | `F:\pilates-studio-admin\src\pages\bookings\index.tsx`、`F:\pilates-studio-admin\backend\src\common\dto\pagination.dto.ts` | 已将统计请求常量 `BOOKING_QUERY_PAGE_SIZE` 改为 100 | 回归通过：`/bookings` 请求 `pageSize=10` 和 `pageSize=100`，无 400、无控制台错误 |
| INT-004 | Verified | High | 后端 e2e / 认证-会员-预约流 | 在 `F:\pilates-studio-admin\backend` 执行 `cmd /c npm run test:e2e` | `auth-member-booking.e2e-spec.ts` 编译测试模块失败：`BookingsService` 依赖的 `NotificationsService` 未注入；随后 fixture 会员无有效会籍/会籍过期导致预约 400 | 后端 e2e 两个测试套件应全部通过 | `F:\pilates-studio-admin\backend\test\auth-member-booking.e2e-spec.ts`、`F:\pilates-studio-admin\backend\src\modules\bookings\bookings.service.ts` | 已补 `NotificationsService` mock、`app?.close()` 防护、有效会籍 fixture 与当前预约名额断言 | 回归通过：`cmd /c npm run test:e2e` 2 个测试套件 / 2 个测试全部通过 |

## 已执行检查

- 后端 `cmd /c npm run typecheck`：通过。
- 后端 `cmd /c npm test`：通过，24 个测试套件 / 140 个测试全部通过。
- 后端 `cmd /c npm run build`：通过，NestJS 生产构建完成。
- 后端 `cmd /c npm run prisma:migrate:deploy`：通过，无待执行迁移。
- 后端 `cmd /c npm run seed`：通过，已创建/更新测试数据。
- 后端健康检查 `http://127.0.0.1:3000/api/health`：200。
- 小程序 `cmd /c npm run test:api`：回归通过。
- 小程序写操作 smoke `cmd /c "set API_SMOKE_MUTATIONS=1&& npm run test:api"`：通过，覆盖反馈提交与续费申请。
- 后端 `cmd /c npm run test:e2e`：初次失败已登记 `INT-004`，修复后回归通过，2 个测试套件 / 2 个测试全部通过。
- 最终联调回归：小程序 `cmd /c npm run verify` 通过；小程序写操作 API smoke 通过；后端 `typecheck`、`test`、`test:e2e`、`build` 全部通过；后台浏览器主路由 API/console 回归通过。

## 阻塞与人工复测项

- 真实微信 code 登录和合法 HTTPS 域名：待生产/体验环境复测。
- 生产数据库与正式业务数据初始化：待确认。
