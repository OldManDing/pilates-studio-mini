# 小程序功能不可用补查闭环 2026-05-04

## 结论

- `dist` 已重新编译：`2026-05-04 06:26:13`，`dist/app.json` 注册 18 个页面，`verify:weapp-dist` 通过。
- 小程序基础门禁通过：`typecheck`、`lint`、`smoke-tests`、`build:weapp`、`verify-weapp-dist` 全部通过。
- 后端已重启并恢复到 `http://127.0.0.1:3000/api`，`/api/health` 返回 200。
- 本轮确认 1 个真实问题并已修复：账号注销申请接口允许 `SENT` 状态下重复提交。
- 之前功能入口报告中的多项 `timeout` 不是业务入口断链；逐个独立连接复测时，对应入口可跳转。

## 新增发现问题

| ID | 问题 | 是否复现 | 根因 | 状态 |
| --- | --- | --- | --- | --- |
| WMP-2026-05-04-03 | 已有 `pending` 注销申请时，继续调用 `POST /support/account-deletion-request` 仍会创建新申请 | 已复现 | `submitAccountDeletionRequest` 只检查 `NotificationStatus.PENDING`；但状态查询把 `SENT` 也展示为 `pending`，两个接口对“未处理申请”的定义不一致 | 已解决 |
| WMP-2026-05-04-04 | 批量微信自动化入口复测出现 `switchTab/reLaunch timeout` | 已复现 | 微信开发者工具自动化连接/路由命令不稳定；失败项逐个独立连接复测通过，未证明业务入口断链 | 非业务缺陷，已隔离 |

## 已解决问题

### WMP-2026-05-04-03 重复注销申请

- 复现方式：先查 `GET /support/account-deletion-request/status`，返回 `pending` 且 `notificationStatus=SENT`；随后再次调用 `POST /support/account-deletion-request`。
- 修复前结果：接口返回 `201` 和新的 `requestId`。
- 根因：提交接口只挡 `PENDING`，没有复用状态查询里的“已处理/未处理”语义。
- 修改文件：
  - `F:\pilates-studio-admin\backend\src\modules\support\support.service.ts`
  - `F:\pilates-studio-admin\backend\src\modules\support\support.service.spec.ts`
- 修复方式：新增 `isAccountDeletionRequestProcessed`，提交前查询最新注销申请；只要最新申请未处理，就返回 `ConflictException`。
- 复测结果：重复提交返回 `409 Conflict`，错误为 `An account deletion request is already pending`。
- 影响范围：只影响账号注销申请去重；反馈提交、预约创建/取消、通知偏好、基础 API 烟测均已复测通过。

## 复测证据

| 验证项 | 结果 |
| --- | --- |
| `npm.cmd run verify` in `F:\pilates-studio-mini` | 通过，重新生成 `dist` |
| `npm.cmd run test:api` in `F:\pilates-studio-mini` | 通过 |
| `npm.cmd test -- support.service.spec.ts` in `F:\pilates-studio-admin\backend` | 通过，8 tests |
| `npm.cmd run typecheck` in `F:\pilates-studio-admin\backend` | 通过 |
| `GET /api/health` | 200 |
| 预约创建并取消清理 | 通过 |
| 通知偏好切换并还原 | 通过 |
| 反馈提交 | 通过 |
| 重复注销申请 | 修复后返回 409 |

## 仍未解决或未完全自动化验证

| 项 | 当前卡点 | 状态 |
| --- | --- | --- |
| 微信开发者工具批量自动化稳定性 | 批量脚本会出现 `switchTab/reLaunch timeout`，但单入口复测可通过；该问题会污染报告，不应直接算业务失败 | 未作为业务缺陷关闭 |
| 真机扫码验证 | Codex 无法直接控制实体手机微信扫码、授权、支付弹窗和真机网络 | 未验证 |
| 真实支付链路 | 当前本地后端以 `WECHAT_PAY_MOCK=true` 启动，只能验证本地 mock 支付/接口路径 | 未做生产支付验收 |

## 漏查最严重模块

- 账号注销申请状态流转：之前只验证前端按钮状态，没有验证接口层是否能绕过重复提交。
- 微信开发者工具自动化报告判读：之前把部分 `timeout` 与业务失败混在一起，需要区分自动化连接失败和真实入口断链。
- 本地后端运行环境：`backend/local-config` 中 `DATABASE_URL` 为空，服务依赖外部环境变量启动，重启时容易导致 API 全部不可用。

## 下一步优先级

1. 把后端本地运行配置显式化，避免 `DATABASE_URL` 只存在于启动 shell 环境里。
2. 继续用单入口、独立连接方式补测微信开发者工具，避免批量 `timeout` 误报。
3. 用实体手机扫码 `dist` 预览包做真机网络、授权和支付弹窗验证。

## 当前上线判断

- 小程序 `dist` 构建、源码门禁、接口烟测、主要入口和本轮修复项已通过。
- 未达到最终上线签核标准：真机扫码和真实微信支付链路尚未完成。
