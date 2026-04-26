# 小程序真实 API 对接开发任务计划

## 目标

让 `pilates-studio-mini` 能以小程序用户身份调用 `pilates-studio-admin/backend` 的真实接口，优先打通登录态、会员资料、课程场次、预约、会员方案和交易记录。

## 已确认问题

1. 后端全局鉴权当前只识别 `adminUser` JWT，小程序需要 `miniUser` JWT。
2. 后端分页参数和返回元信息使用 `pageSize`，小程序 API 层当前使用 `limit`。
3. `/members/profile`、`/members/my-memberships`、`/bookings/my` 已有 member-facing 实现，但会被 admin 权限守卫拦截。
4. 小程序当前期待 `/transactions/my` 和 `/transactions/my-summary`，后端只有管理端 `/transactions` 与 `/transactions/summary`。
5. `/membership-renewals`、`/support/feedback` 后端暂缺，先保留为后续补口，不阻塞本轮核心联调。

## 实施步骤

### 1. 后端新增 mini 登录契约

- 新增 `POST /api/mini-auth/login`。
- 请求体支持微信 `code`，并允许本地开发环境用 `openId` 做联调。
- 登录后查找或创建 `MiniUser`，返回 `accessToken`、`miniUser`、`member`。
- token payload 标记 `principalType: 'MINI_USER'`，`sub` 为 `miniUser.id`。

### 2. 后端鉴权与权限适配

- `JwtAuthGuard` 同时支持 admin token 和 mini-user token。
- `request.user` 保持统一 `sub` 字段，并增加 `principalType`。
- `PermissionsGuard` 对 mini-user 只放行明确标记的 member-facing 路由。
- 新增轻量 decorator，例如 `@AllowMiniUser()`，避免把 mini-user 放进后台权限体系。

### 3. 后端 member-facing 路由收口

- 给 `/members/profile`、`/members/my-memberships`、`/bookings/my`、小程序预约创建/取消、交易记录等路由添加 mini-user 放行标记。
- 给取消预约增加归属校验，mini-user 只能取消自己的 booking。
- 新增 `/transactions/my` 和 `/transactions/my-summary`，按当前 mini-user 绑定会员过滤。

### 4. 小程序 API 契约适配

- 请求层把 `limit` 自动转换为 `pageSize`。
- `PaginationMeta` 兼容 `pageSize`，保留 `limit` 供现有页面使用。
- 保持 `API_BASE_URL=http://127.0.0.1:3000/api`。

### 5. 验证

- 后端执行 `npm run typecheck` 和 `npm run build`。
- 小程序执行 `npm run typecheck`、`npm run test:smoke`、`npm run build:weapp` 或 `npm run verify`。
- smoke 测试补充对 `pageSize`、`mini-auth/login`、`transactions/my` 的静态契约断言。

## 本轮不做

- 不接真实微信服务端完整手机号解密流程。
- 不改数据库 schema。
- 不实现 `/membership-renewals` 与 `/support/feedback` 的完整业务闭环，只在最终风险里标注。
- 不提交或推送代码。
