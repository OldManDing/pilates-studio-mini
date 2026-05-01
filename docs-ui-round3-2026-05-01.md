# 小程序 UI 测试 Round 3 问题清单（2026-05-01）

## 测试范围

- 目标：处理 Round 1/2 之后仍然存在的全局性 UI 体验问题
- 方法：共享样式与高频页面实现复查 + 构建门禁复测

## 问题清单（Round 3）

| ID | 级别 | 问题 | 锚点 |
|---|---|---|---|
| M3-001 | P1 | `PageShell` 的 `reserveTabBarSpace` 预留高度与真实自定义 tabbar 内边距不完全匹配，存在底部留白偏大风险 | `src/components/shell/PageShell/index.scss:32-36`, `src/custom-tab-bar/index.scss:18-25` |
| M3-002 | P1 | `Loading --compact` 最小高度 `280px` 仍偏大，短页面切换时跳变感明显 | `src/components/Loading/index.scss:13-29` |
| M3-003 | P1 | `Empty` 组件 action 按钮 `min-width: 196px` 对窄卡片场景过重 | `src/components/Empty/index.scss:61-71` |
| M3-004 | P1 | 我的预约标题和元信息均为单行省略，长课程名和长教练/时间组合信息损失明显 | `src/pages/my-bookings/index.scss:166-223` |
| M3-005 | P1 | 个人页登录面板与账户卡在无登录/有登录两种状态下视觉重量差距过大，切换跳变明显 | `src/pages/profile/index.scss:24-57`, `60-111` |
| M3-006 | P1 | 个人页菜单项“登录后查看”提示与正文同层，长描述时易压缩可读空间 | `src/pages/profile/components/ProfileMenuSection.tsx:27-41`, `src/pages/profile/index.scss:287-318` |
| M3-007 | P1 | 通用空态插图尺寸 `208px` 偏大，在多个小卡片页中会造成单屏信息过少 | `src/components/Empty/index.scss:38-43` |
| M3-008 | P1 | 课程页日期 pill 最小宽度 84px，14天长列表下横向滚动负担偏重，可进一步压缩 | `src/pages/courses/index.scss:122-185` |
| M3-009 | P1 | 帮助页分类 pill 和 FAQ 列表的间距体系仍偏宽，小屏浏览层级稍显松散 | `src/pages/help/index.scss:59-101`, `103-170` |
| M3-010 | P1 | 我的教练列表缺少对右侧“已上课”统计和长描述的更紧凑平衡策略 | `src/pages/my-coaches/index.scss:55-119` |

## Round 3 修复优先级

优先处理：
1. 全局组件：PageShell / Loading / Empty
2. 我的预约 / 个人页小屏信息损失
3. 日期 pill 与帮助页分类的空间压缩
