# 小程序功能测试 Round 3（2026-05-02）

## 目标

- 收口动作级一致性问题
- 确保列表能加载之外，用户在“提交/取消/标记已读”等具体操作上也能得到正确反馈与恢复路径

## Round 3 问题清单

| # | 问题 | 位置 | 结果 |
|---|---|---|---|
| 1 | 帮助页反馈提交失败只显示固定提示 | `src/pages/help/index.tsx` | 已修复 |
| 2 | 反馈提交遇到登录/网络问题时无法透出真实原因 | `src/pages/help/index.tsx` | 已修复 |
| 3 | 我的预约取消动作遇到未授权后不会标记 `authRequired` | `src/pages/my-bookings/index.tsx` | 已修复 |
| 4 | 我的预约取消动作失败后后续页面恢复路径不够连贯 | `src/pages/my-bookings/index.tsx` | 已修复 |
| 5 | 通知单条已读失败时未记录登录失效语义 | `src/pages/notifications/index.tsx` | 已修复 |
| 6 | 通知一键已读部分失败时未对未授权状态做收敛 | `src/pages/notifications/index.tsx` | 已修复 |
| 7 | 通知动作失败后用户仍可能停留在“可操作但实际未授权”的状态 | `src/pages/notifications/index.tsx` | 已缓解 |
| 8 | 课程详情预约失败虽然透传错误，但仍需保证登录恢复路径优先可达 | `src/pages/course-detail/index.tsx` | 已验证 |
| 9 | 训练记录登录恢复需要验证回拉后状态是否稳定 | `src/pages/training-records/index.tsx` | 已验证 |
| 10 | 会员续费登录恢复需要验证回拉后选中项是否保留 | `src/pages/membership-renew/index.tsx` | 已验证 |
| 11 | 会员中心登录恢复需要验证 CTA 文案与空态动作一致 | `src/pages/membership/index.tsx` | 已验证 |
| 12 | 消费记录登录恢复需要验证摘要失败提示不影响流水展示 | `src/pages/transactions/index.tsx` | 已验证 |
| 13 | 设置页登录恢复需要验证手机号缓存刷新后展示一致 | `src/pages/settings/index.tsx` | 已验证 |
| 14 | 修改密码真实错误文案需要验证不影响成功路径 | `src/pages/account-security/index.tsx` | 已验证 |
| 15 | 个人页受保护菜单登录恢复需要验证后续导航成功 | `src/pages/profile/index.tsx` | 已验证 |
| 16 | 我的预约 hook 依赖存在多余项，影响诊断噪声 | `src/pages/my-bookings/index.tsx` | 已修复 |
| 17 | 课程详情标签 key 诊断噪声会影响最终门禁 | `src/pages/course-detail/index.tsx` | 已修复 |
| 18 | Round 1/2 改动后的所有修改文件需再次确认零 LSP 诊断 | 多文件 | 已验证 |
| 19 | mutation smoke 需要确认在启用写操作时仍通过 | `scripts/api-smoke.cjs` 关联流程 | 已验证 |
| 20 | 构建通过后需确认无新增类型/编译回归 | 全项目 | 已验证 |

## 本轮修复摘要

- 帮助页反馈提交改为透传真实错误原因
- 通知已读与预约取消动作在未授权失败时回写 `authRequired`，为后续登录恢复铺路
- 清理两处诊断噪声，保证最终门禁干净
- 对前三轮涉及的登录恢复、摘要说明、动作反馈进行统一复测

## 本轮修改文件

- `src/pages/help/index.tsx`
- `src/pages/notifications/index.tsx`
- `src/pages/my-bookings/index.tsx`
- `src/pages/course-detail/index.tsx`

## 本轮复测

- `npm run typecheck` ✅
- `npm run test:smoke` ✅
- `npm run build:weapp` ✅
- `npm run test:api` ✅
- `API_SMOKE_MUTATIONS=1 npm run test:api` ✅
- 修改文件 `lsp_diagnostics` 全部为 0 ✅

## 结论

Round 3 已完成动作级一致性收口，当前重点链路在“首屏失败”“动作失败”“登录恢复后回拉”三个层面都具备可自救能力。
