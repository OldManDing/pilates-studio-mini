# 小程序 UI 测试闭环记录（2026-05-05）

## 范围

- 目标：修复并验证微信小程序 UI 触控热区、返回入口、头图布局、按钮一致性、空态/加载态/错误态可视问题。
- 限制：不改后端接口，只做前端最小必要改动。
- 工具链：`testing-workflow`、微信开发者工具自动化、`npm run verify`、定点点击矩阵。

## 三轮测试结果

### 第 1 轮

复现问题：

- 首页 4 个按钮热区不足 44px。

根因：

- 首页局部按钮样式把视觉和热区都压得过低。

修复：

- 放大首页会员状态、查看详情、主 CTA、门店导航的热区。

复测：

- 首页重新审计后 0 问题。

### 第 2 轮

复现问题：

- 通用返回按钮只有 `36x36`。
- 浮动返回按钮只有 `41x41`。
- 预约页头部“我的预约”只有 `75x31`。
- 课程详情 CTA 只有 `402x36`。
- 设置页用户协议/隐私入口只有 `43px` 高。

根因：

- 通用壳组件和页面局部按钮都按视觉稿缩放了，但没保住小程序触控底线。

修复：

- 放大 `PageHeader` 返回按钮。
- 放大 `FloatingBackButton`。
- 放大预约页头部按钮。
- 放大课程详情 CTA。
- 放大设置页协议/隐私入口。

复测：

- 全页 UI 矩阵 20/20 通过，P1/P2 = 0。

### 第 3 轮

复现问题：

- 需要截图证据和构建门禁。

验证：

- 抽样截图 6/6 通过。
- `npm run verify` 通过。
- `dist` 重新构建后再跑全页 UI 矩阵，20/20 通过，P1/P2 = 0。

## 已修复文件

- `src/pages/index/index.scss`
- `src/components/shell/PageHeader/index.scss`
- `src/components/shell/FloatingBackButton/index.scss`
- `src/pages/courses/index.scss`
- `src/pages/course-detail/index.scss`
- `src/pages/settings/index.scss`
- `scripts/weapp-ui-audit.cjs`
- `scripts/weapp-click-matrix.cjs`

## 关键验证证据

- `npm run typecheck` 通过
- `npm run lint` 通过
- `npm run test:smoke` 通过
- `npm run build:weapp` 通过
- `npm run verify:weapp-dist` 通过
- `npm run verify` 通过
- 微信小程序 UI 审计：
  - 首轮首页复测：0 问题
  - 第二轮全页复测：20/20 通过，P1/P2 = 0
  - 第三轮截图抽样：6/6 通过，P1/P2 = 0
- 定点点击验证：
  - `BTN-H01` / `BTN-H02` / `BTN-H03` / `BTN-H13` 通过
  - `BTN-C00` / `BTN-D03` 通过
  - `BTN-S08` / `BTN-S09` 通过

## 直接量化结果

- `PageHeader` 返回按钮：`50x50`
- `FloatingBackButton`：`50x50`
- 预约页头部按钮：`topStyle = padding-right: 106px;`
- 预约页“我的预约”按钮：`75x46`

## 当前风险

- 微信开发者工具自动化里 `systemInfo` / 菜单胶囊定位在部分轮次会超时，所以最终审计没有把胶囊坐标写进报告；但页面实际右侧避让样式已生效，且截图和定点尺寸验证都正常。
- `weapp-click-matrix` 里原来 settings 的两个用例 selector 写错了，已修正为 `settings-about-row--clickable`，避免把测试脚本误判成页面问题。

## 结论

- 本轮新增 UI 问题已清零。
- P0/P1 已清零。
- 核心流程可走通。
- 当前可按 UI 维度视为达到上线标准。
