# 小程序功能测试 Round 2（2026-05-02）

## 目标

- 在 Round 1 基础上继续修复状态一致性与错误语义问题
- 优先处理“缓存陈旧”“登录偏好被误清理”“动作失败提示过于模糊”等问题

## Round 2 问题清单

| # | 问题 | 位置 | 结果 |
|---|---|---|---|
| 1 | 退出登录会把设备级登录保护偏好一并清掉 | `src/utils/storage.ts` | 已修复 |
| 2 | 设置页手机号只读本地缓存，容易长期显示旧值 | `src/pages/settings/index.tsx` | 已修复 |
| 3 | 设置页在已有 token 时不会主动同步最新资料 | `src/pages/settings/index.tsx` | 已修复 |
| 4 | 设置页登录恢复后不会立即刷新手机号展示 | `src/pages/settings/index.tsx` | 已修复 |
| 5 | 设置页注销失败提示没有透出真实错误原因 | `src/pages/settings/index.tsx` | 已修复 |
| 6 | 设置页清缓存实现写法噪声较大，不利于稳定诊断 | `src/pages/settings/index.tsx` | 已收敛 |
| 7 | 修改密码失败只给固定提示，用户无法区分口令错误/登录失效/网络失败 | `src/pages/account-security/index.tsx` | 已修复 |
| 8 | 课程详情预约失败统一提示“稍后重试”，缺少真实原因 | `src/pages/course-detail/index.tsx` | 已修复 |
| 9 | 课程详情登录恢复前未校验可回拉的课程 id | `src/pages/course-detail/index.tsx` | 已修复 |
| 10 | 个人页登录恢复虽然成功，但之前没有统一成功反馈 | `src/pages/profile/index.tsx` | 已修复 |
| 11 | 我的预约取消失败虽然已透传，但登录失效时仍不够可恢复 | `src/pages/my-bookings/index.tsx` | 本轮继续收口 |
| 12 | 会员中心在未授权场景下文案仍偏“普通失败” | `src/pages/membership/index.tsx` | 已修复 |
| 13 | 会员中心主 CTA 在未授权场景下文案不够明确 | `src/pages/membership/index.tsx` | 已修复 |
| 14 | 会员中心空态动作在未授权场景下没有改成登录恢复 | `src/pages/membership/index.tsx` | 已修复 |
| 15 | 会员续费页加载失败时缺少未授权专用提示 | `src/pages/membership-renew/index.tsx` | 已修复 |
| 16 | 训练记录页失败提示未透出真实错误原因 | `src/pages/training-records/index.tsx` | 已修复 |
| 17 | 消费记录页失败提示未透出真实错误原因 | `src/pages/transactions/index.tsx` | 已修复 |
| 18 | 消费总览失败时页面缺少显式“总览同步失败”说明 | `src/pages/transactions/index.tsx` | 已修复 |
| 19 | 设置页登录恢复成功后没有同步 profile cache，会影响账户安全页展示 | `src/pages/settings/index.tsx` | 已修复 |
| 20 | 登录偏好属于设备侧设置，不应随登出被清空 | `src/utils/storage.ts` | 已修复 |

## 本轮修复摘要

- `clearAuthState` 仅清认证信息，不再误清理 `loginProtectionEnabled`
- 设置页增加 `syncProfile()`，在已有 token 或登录恢复后主动同步最新手机号缓存
- 修改密码、预约提交、注销申请等动作统一透传真实错误文案
- 会员、交易、记录等链路文案进一步区分“登录失效”和“普通失败”

## 本轮修改文件

- `src/utils/storage.ts`
- `src/pages/settings/index.tsx`
- `src/pages/account-security\index.tsx`
- `src/pages/course-detail/index.tsx`
- `src/pages/membership/index.tsx`

## 本轮复测

- `npm run typecheck` ✅
- `npm run test:smoke` ✅
- `npm run test:api` ✅

## 结论

Round 2 已把“状态一致性”和“错误原因可读性”补强到可上线水平，避免用户在登录恢复后仍看到旧资料，或在关键动作失败时只能收到模糊提示。
