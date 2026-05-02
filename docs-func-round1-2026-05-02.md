# 小程序功能测试 Round 1（2026-05-02）

## 目标

- 启动小程序功能测试第一轮闭环
- 优先修复登录恢复、危险动作鉴权、摘要误导态三类高风险问题
- 仅改前端，不改后端接口

## Round 1 问题清单

| # | 问题 | 位置 | 结果 |
|---|---|---|---|
| 1 | 个人页受保护菜单点击后只 toast，不直接发起微信登录 | `src/pages/profile/index.tsx` | 已修复 |
| 2 | 登录成功后个人页不会立即回拉资料，用户仍停留在旧态 | `src/pages/profile/index.tsx` | 已修复 |
| 3 | 课程详情页“登录同步后预约”只跳个人页，不直接完成登录恢复 | `src/pages/course-detail/index.tsx` | 已修复 |
| 4 | 课程详情底部 CTA 在未登录时只跳页，不自动完成恢复 | `src/pages/course-detail/index.tsx` | 已修复 |
| 5 | 课程详情登录恢复后不自动重拉当前课程资料 | `src/pages/course-detail/index.tsx` | 已修复 |
| 6 | 我的预约未授权空态只跳个人页，不直接恢复登录 | `src/pages/my-bookings/index.tsx` | 已修复 |
| 7 | 我的预约登录恢复后不自动重拉列表 | `src/pages/my-bookings/index.tsx` | 已修复 |
| 8 | 会员中心首屏未授权与普通网络失败混在一起 | `src/pages/membership/index.tsx` | 已修复 |
| 9 | 会员中心主 CTA 在未授权状态下仍表现为“续费/查看方案” | `src/pages/membership/index.tsx` | 已修复 |
| 10 | 会员续费页首屏未授权仅显示加载失败 | `src/pages/membership-renew/index.tsx` | 已修复 |
| 11 | 会员续费页在 `authRequired` 下点击提交不能自恢复 | `src/pages/membership-renew/index.tsx` | 已修复 |
| 12 | 通知页首屏未授权只显示“消息加载失败” | `src/pages/notifications/index.tsx` | 已修复 |
| 13 | 通知页首屏失败态没有明确“去登录”动作 | `src/pages/notifications/index.tsx` | 已修复 |
| 14 | 训练记录页首屏未授权被误判成普通加载失败 | `src/pages/training-records/index.tsx` | 已修复 |
| 15 | 训练记录页失败态没有直接登录恢复动作 | `src/pages/training-records/index.tsx` | 已修复 |
| 16 | 消费记录页未授权仅展示通用失败态 | `src/pages/transactions/index.tsx` | 已修复 |
| 17 | 消费记录页失败态没有“去登录”自恢复入口 | `src/pages/transactions/index.tsx` | 已修复 |
| 18 | 消费总览接口失败时会静默继续展示 `0`，形成误导性成功态 | `src/pages/transactions/index.tsx` | 已修复 |
| 19 | 设置页“退出登录”在无 token 时也直接进入危险动作确认链 | `src/pages/settings/index.tsx` | 已修复 |
| 20 | 设置页“申请注销账户”在无 token 时也直接进入危险动作确认链 | `src/pages/settings/index.tsx` | 已修复 |

## 本轮修复摘要

- 统一把“未授权首屏失败”改成 **明确区分 `authRequired` 与普通网络失败**
- 统一把关键流程入口改成 **微信登录恢复 + 自动回拉页面数据**
- 交易页在摘要接口失败时明确提示“总览同步失败”，不再伪造正常 0 值
- 设置页危险动作增加前置鉴权，不让未登录用户直接进入退出/注销确认流

## 本轮修改文件

- `src/pages/profile/index.tsx`
- `src/pages/course-detail/index.tsx`
- `src/pages/my-bookings/index.tsx`
- `src/pages/membership/index.tsx`
- `src/pages/membership-renew/index.tsx`
- `src/pages/notifications/index.tsx`
- `src/pages/training-records/index.tsx`
- `src/pages/transactions/index.tsx`
- `src/pages/settings/index.tsx`

## 本轮复测

- `npm run typecheck` ✅
- `npm run test:smoke` ✅
- `npm run build:weapp` ✅
- `npm run test:api` ✅
- `API_SMOKE_MUTATIONS=1 npm run test:api` ✅

## 结论

Round 1 已完成对高频流程的首轮收口：未登录恢复路径建立完成，危险动作前置鉴权补齐，交易页误导性成功态已消除。
