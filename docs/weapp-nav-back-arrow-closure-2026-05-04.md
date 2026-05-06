# 子页返回箭头清理闭环

## 结论

已处理。

## 变更点

- 统一页面头部不再渲染自定义返回箭头。
- 受影响页面继续保留标题、副标题和右侧操作位，但不再显示左上返回按钮。

## 主要文件

- `src/components/shell/PageHeader/index.tsx`

## 重新编译

- 已执行 `cmd /c npm run build:weapp`
- 已生成并刷新 `dist/`

## 复测结果

- 通过 `miniprogram-automator` 连接当前 WeChat DevTools
- 复测页面：
  - `coaches`
  - `membership`
  - `membership-renew`
  - `my-bookings`
  - `training-records`
  - `my-coaches`
  - `notifications`
  - `help`
  - `settings`
  - `account-security`
  - `agreement`
  - `privacy`
  - `transactions`
  - `course-detail`（无 id / 有效 id）
  - `coach-detail`（无 id / 有效 id）
- 结果：上述页面 `page-header__back` 节点数均为 `0`

## 证据

- `docs/wechat-devtools/ui-recheck-2026-05-04T03-27-34/ui-recheck-report.json`
- `docs/wechat-devtools/nav-custom-2026-05-04T03-15-36/nav-custom-report.json`

## 当前状态

- 已解决
