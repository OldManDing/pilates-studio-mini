# 阶段三：小程序 + 后台 + 后端联调 Bug 单

> 测试目标：验证小程序模拟登录、后端 API、后台页面与关键写操作在当前真实演示数据下可联通，并回归已知跨端数据问题。

## 测试环境

| 项目 | 内容 |
| --- | --- |
| 测试时间 | 2026-04-28 |
| 小程序仓库 | `F:\pilates-studio-mini` |
| 后台/后端仓库 | `F:\pilates-studio-admin` |
| 后端 API | `http://127.0.0.1:3000/api` |
| 后台地址 | `http://127.0.0.1:8000` |
| 小程序模拟用户 | `dev-openid-pilates` |
| 后台管理员 | `admin@pilates.com / Admin123!` |

## 已执行验证

| 类型 | 命令/方式 | 结果 |
| --- | --- | --- |
| 后端健康检查 | `GET /api/health` | Passed |
| 小程序读链路 | `cmd /c npm run test:api` | Passed，覆盖登录、会员、会员卡、场次、预约、交易、会员方案 |
| 小程序写链路 | `$env:API_SMOKE_MUTATIONS='1'; cmd /c npm run test:api` | Passed，覆盖反馈提交、续费申请 |
| 后端 TypeScript | `cmd /c npm run typecheck` | Passed |
| 后端单元测试 | `cmd /c npm test` | Passed，24 个测试套件 / 140 个测试 |
| 后端 e2e | `cmd /c npm run test:e2e` | Passed，2 个测试套件 / 2 个测试 |
| 后端构建 | `cmd /c npm run build` | Passed |
| 后台主路由联调 | Playwright 巡检后台 10 个路由 | Passed，无 4xx/5xx API、无 console error |

## 联调覆盖矩阵

| 业务链路 | 小程序入口/API | 后台/后端入口 | 期望传播 | 本轮结果 |
| --- | --- | --- | --- | --- |
| 模拟登录 | `/mini-auth/login` with `openId=dev-openid-pilates` | `MiniAuthService.resolveWechatSession` | 返回 JWT，后续小程序接口携带 token | Passed |
| 会员资料 | `/members/profile`、`/members/my-memberships` | 后台 `/members`、会员服务 | 小程序会员资料与后台会员数据一致 | Passed |
| 课程/场次 | `/course-sessions/upcoming`、课程详情 | 后台 `/courses`、`/bookings` | 后台课程/场次能被小程序读取 | Passed |
| 预约记录 | `/bookings/my` | 后台 `/bookings` | 小程序我的预约与后台预约数据链路正常 | Passed |
| 教练资料 | `/coaches/active`、教练详情 | 后台 `/coaches` | 后台教练数据能被小程序读取 | Passed |
| 交易记录 | `/transactions/my` | 后台 `/finance` | 小程序交易流水与后台财务数据链路正常 | Passed |
| 会员方案/续费 | `/membership-plans/active`、`/membership-renewals` | 后台财务/通知/交易相关服务 | 小程序可提交续费申请，后端返回 submitted | Passed |
| 帮助反馈 | `/support/feedback` | 后台 `/notifications` / 支持服务 | 小程序可提交反馈，后端返回 submitted | Passed |

## Bug 列表

| ID | 状态 | 严重级别 | 模块/API | 复现步骤 | 实际结果 | 期望结果 | 关联文件 | 修复说明 | 回归结果 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| INT-001 | Verified | High | 真机本地联调 / request 合法域名 | 真机预览使用局域网 HTTP API | 微信拦截非合法域名，或本地地址不可访问 | 本地调试可用局域网 API；正式环境必须 HTTPS 合法域名 | `.env`、`.gitignore`、`config/index.js`、`src/api/auth.ts`、`project.private.config.json` | 已使用私有 `.env` + 私有项目配置支持本地真机调试，并保留正式配置校验 | `verify`、`test:api`、写操作 smoke、`dist` 检查通过 |
| INT-002 | Verified | High | 模拟登录 / 微信凭证未配置 | 真机 `Taro.login()` 获得 code 后请求后端，但后端无 `WECHAT_APPID/WECHAT_SECRET` | 后端无法 `code2session` | 本地测试可模拟登录成功，生产使用真实微信凭证 | `config/index.js`、`src/api/auth.ts`、`.env.example` | 新增 `USE_MINI_OPEN_ID_LOGIN`，开发环境优先使用 `MINI_OPEN_ID` | `test:api` 和 `dist` 检查均通过 |
| INT-003 | Verified | High | 后台列表响应 / 后端分页约束 | 后台页面请求列表数据 | 分页响应 meta 或 pageSize 约束曾导致页面空数据/400 | 后台列表与小程序 API 均按后端分页契约运行 | 后台 `src/services/*.ts`、后端分页 DTO | 已修复后台响应解析与 pageSize 调用 | 后台 typecheck、smoke、build、浏览器巡检通过 |
| INT-004 | Verified | High | 小程序预约详情权限 | 小程序登录后先请求 `/bookings/my`，再请求返回项的 `/bookings/:id` | 后端返回 `Mini user is not allowed to access this resource` | 小程序用户应能访问自己的预约详情，不能访问他人预约 | `backend/src/modules/bookings/bookings.controller.ts`、`backend/src/modules/bookings/bookings.service.ts` | 已给详情接口允许 mini user，并在 service 校验 `booking.member.miniUserId` 防越权 | 后端 typecheck/build 通过；重启后扩展 `test:api` 通过 |
| INT-005 | Verified | High | 小程序交易详情权限 | 小程序登录后先请求 `/transactions/my`，再请求返回项的 `/transactions/:id` | 后端返回 `Mini user is not allowed to access this resource` | 小程序用户应能访问自己的交易详情，不能访问他人交易 | `backend/src/modules/transactions/transactions.controller.ts`、`backend/src/modules/transactions/transactions.service.ts` | 已给详情接口允许 mini user，并在 service 校验 `transaction.member.miniUserId` 防越权 | 后端 typecheck/build/test/e2e 通过；重启后扩展 `test:api` 通过 |

## 未覆盖 / 人工复测项

- 真实微信 `code2session` 仍依赖生产/体验环境 `WECHAT_APPID`、`WECHAT_SECRET` 与 HTTPS 合法域名。
- 本轮不执行会改变核心演示数据的破坏性跨端操作（如大量取消预约、删除/禁用实体）。
- 后台不同角色权限、生产通知投递、外部邮件/短信/微信模板消息未覆盖。
