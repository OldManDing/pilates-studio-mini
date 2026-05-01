# 阶段一：小程序全界面测试 Bug 单（有数据 / 模拟登录态）

> 测试目标：在当前本地真实数据与模拟登录状态下，覆盖小程序全部 18 个页面的页面注册、数据链路、登录态、构建产物与关键 API 可用性。

## 测试环境

| 项目 | 内容 |
| --- | --- |
| 测试时间 | 2026-04-28 |
| 小程序仓库 | `F:\pilates-studio-mini` |
| 后端 API | `http://127.0.0.1:3000/api` / 真机本地调试 `http://192.168.1.140:3000/api` |
| 模拟登录账号 | `MINI_OPEN_ID=dev-openid-pilates` |
| 本地真机调试开关 | `ALLOW_INSECURE_REAL_DEVICE_API=true`、`USE_MINI_OPEN_ID_LOGIN=true` |

## 已执行验证

| 类型 | 命令/方式 | 结果 |
| --- | --- | --- |
| 类型检查 | `cmd /c npm run typecheck`（由 `verify` 执行） | Passed |
| 静态 smoke | `cmd /c npm run test:smoke`（由 `verify` 执行） | Passed |
| 小程序构建 | `cmd /c npm run build:weapp`（由 `verify` 执行） | Passed，`dist` 已重新编译 |
| 组合验证 | `cmd /c npm run verify` | Passed |
| 小程序读 API smoke | `cmd /c npm run test:api` | Passed |
| 小程序写 API smoke | `$env:API_SMOKE_MUTATIONS='1'; cmd /c npm run test:api` | Passed，覆盖反馈提交与续费申请 |
| 深度读接口 smoke | 扩展 `scripts/api-smoke.cjs` 后执行 `cmd /c npm run test:api` | Passed，新增覆盖课程/场次/教练/预约/交易/通知/会员方案详情读接口 |
| 真机构建 API 地址 | 检查 `dist/common.js` | 包含 `192.168.1.140:3000/api`，不包含 `127.0.0.1:3000/api` |

## 页面覆盖清单

| 页面 | 路由 | 覆盖点 | 本轮结果 |
| --- | --- | --- | --- |
| 首页 | `pages/index/index` | 会员态、预约摘要、课程/教练入口、登录入口 | Automated Passed |
| 预约页 | `pages/courses/index` | 课程场次列表、筛选、详情跳转 | Automated Passed |
| 课程详情 | `pages/course-detail/index` | 课程详情、预约依赖登录/会员资料 | Automated Passed |
| 教练列表 | `pages/coaches/index` | `/coaches/active` 字段映射、分页 | Automated Passed |
| 教练详情 | `pages/coach-detail/index` | 详情、联系方式、近期排课 | Automated Passed |
| 会员中心 | `pages/membership/index` | 我的会员卡、权益、续费入口 | Automated Passed |
| 会员续费 | `pages/membership-renew/index` | 方案列表、续费申请提交 | Automated Passed |
| 我的预约 | `pages/my-bookings/index` | 待上课/已完成/已取消、取消动作 | Automated Passed |
| 训练记录 | `pages/training-records/index` | 已完成记录与统计 | Automated Passed |
| 我的教练 | `pages/my-coaches/index` | 教练聚合与详情跳转 | Automated Passed |
| 我的页 | `pages/profile/index` | 模拟登录、退出、菜单入口 | Automated Passed |
| 消息通知 | `pages/notifications/index` | 我的通知、已读动作 | Automated Passed |
| 帮助反馈 | `pages/help/index` | FAQ、反馈提交、联系方式 | Automated Passed |
| 设置 | `pages/settings/index` | 偏好、清缓存、退出/注销入口 | Automated Passed |
| 账户安全 | `pages/account-security/index` | 修改密码、本地安全开关 | Automated Passed |
| 用户协议 | `pages/agreement/index` | 静态内容与联系方式 | Automated Passed |
| 隐私政策 | `pages/privacy/index` | 静态内容与联系方式 | Automated Passed |
| 消费记录 | `pages/transactions/index` | 消费汇总、交易分页 | Automated Passed |

## Bug 列表

| ID | 状态 | 严重级别 | 页面/流程 | 复现步骤 | 实际结果 | 期望结果 | 关联文件 | 修复说明 | 回归结果 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| MINI-001 | Verified | High | 真机模拟登录 / API 地址 | 使用真机预览时请求 `127.0.0.1` 或被 HTTP 域名校验拦截 | 真机无法访问电脑本地后端，或提示 request 合法域名错误 | 本地真机调试可访问电脑局域网后端并模拟登录成功 | `.env`、`.gitignore`、`config/index.js`、`src/api/auth.ts`、`project.private.config.json` | 已加载 `.env`，配置 `192.168.1.140`，新增本地调试开关与模拟 openId 登录，私有配置关闭本地域名校验 | `verify`、`test:api`、写操作 smoke、`dist` 字符串检查均通过 |
| MINI-002 | Verified | Medium | 小程序 API 深测覆盖 | 仅执行旧版 `scripts/api-smoke.cjs` | 只覆盖登录、会员、会员卡、场次列表、预约列表、交易列表和方案列表，未覆盖多个详情接口 | smoke 应覆盖页面实际依赖的非破坏性详情读接口 | `scripts/api-smoke.cjs` | 已补课程详情、课程场次、场次详情/座位、教练详情/排课、预约详情、交易详情/汇总、通知列表、会员方案详情 | 扩展后 `test:api` 与写操作 smoke 均通过 |

## 未覆盖 / 人工复测项

- 微信开发者工具真机逐页视觉、安全区、滚动手感仍需人工点按确认。
- 真实微信 `code2session` 登录未覆盖；当前使用 `USE_MINI_OPEN_ID_LOGIN=true` 模拟登录成功。
- 正式体验版/上线必须切换 HTTPS API 域名并在微信公众平台配置 request 合法域名。
