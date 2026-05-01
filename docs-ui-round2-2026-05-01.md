# 小程序 UI 测试 Round 2 问题清单（2026-05-01）

## 测试范围

- 目标：在 Round 1 基础上继续处理小屏适配、首屏信息密度、长内容阅读与交互一致性
- 方法：代码审查 + 390/430 断点运行态抽样 + 构建门禁复测

## 问题清单（Round 2）

| ID | 级别 | 问题 | 锚点 |
|---|---|---|---|
| M2-001 | P1 | 首页整体 section gap 固定为 `56px`，首屏以下垂直节奏偏松，小屏滚动成本偏高 | `src/pages/index/index.scss:3-14` |
| M2-002 | P1 | 首页 hero 标题 `46px`、副标题限宽 `82%`，在 390 宽度下视觉重心偏左、信息密度失衡 | `src/pages/index/index.scss:142-156` |
| M2-003 | P1 | 首页会员卡卡片 padding 过大，状态/指标/进度区域纵向占高偏重 | `src/pages/index/index.scss:159-319` |
| M2-004 | P1 | 课程详情 hero 最小高度 `320px` 且 `42vh`，首屏图片区过高，正文进入视口偏慢 | `src/pages/course-detail/index.scss:14-20` |
| M2-005 | P1 | 课程详情正文左右 padding 固定 `$figma-page-x`，小屏文本列偏窄，阅读体感发紧 | `src/pages/course-detail/index.scss:92-99` |
| M2-006 | P1 | 课程详情底部 CTA 区字号与外边距偏大，底部固定操作区视觉重量过重 | `src/pages/course-detail/index.scss:308-337` |
| M2-007 | P1 | 教练详情 hero 标题 `30px` + 84px 头像 + 大间距，首屏身份块偏重 | `src/pages/coach-detail/index.scss:61-90`, `103-125` |
| M2-008 | P1 | 教练详情近期排课项使用较大 padding 和字号，小屏单屏可见场次偏少 | `src/pages/coach-detail/index.scss:263-339` |
| M2-009 | P1 | 个人页账户卡 padding `49px 56px`、统计字号 `35px`，小屏下信息体量过大 | `src/pages/profile/index.scss:60-111`, `208-261` |
| M2-010 | P1 | 个人页菜单项 padding `31px 49px` 过大，列表信息密度偏低 | `src/pages/profile/index.scss:287-318` |
| M2-011 | P1 | 我的教练页 hero 数值 `64px`、描述 `22px/34px`，小屏下首屏过厚重 | `src/pages/my-coaches/index.scss:18-38` |
| M2-012 | P1 | 我的教练列表头像/字号/padding 偏大，单屏可见卡片数过少 | `src/pages/my-coaches/index.scss:55-119` |
| M2-013 | P1 | 帮助页 FAQ 问答行高固定 `35px`，长答案展开后阅读密度偏松 | `src/pages/help/index.scss:128-145` |
| M2-014 | P1 | 帮助页反馈提交区成功态与输入态高度差过大，切换时跳变明显 | `src/pages/help/index.scss:196-243`, `293-345` |
| M2-015 | P1 | 会员中心状态卡和统计区字号、间距过大，小屏下首屏只容纳少量有效信息 | `src/pages/membership/index.scss:22-75`, `162-209` |
| M2-016 | P1 | 会员中心 overview 区使用 `40px / 28px` 级大字号与宽间隔，视觉重量偏重 | `src/pages/membership/index.scss:270-325` |
| M2-017 | P1 | 通知列表项大 padding 和大图标导致列表密度偏低 | `src/pages/notifications/index.scss:95-156` |
| M2-018 | P1 | 设置页 row 与 about-row padding 均为 `32px + figma-card-x`，在小屏上纵向密度偏松 | `src/pages/settings/index.scss:56-147`, `150-209` |
| M2-019 | P1 | 消费记录 summary 卡与 ledger 项在小屏上仍偏重，尤其 summary 区上下留白较大 | `src/pages/transactions/index.scss:11-61`, `70-128` |
| M2-020 | P1 | 我的预约列表 item padding `20px 32px` + 徽标/日期列较宽，小屏信息压缩感明显 | `src/pages/my-bookings/index.scss:93-159`, `166-223` |

## Round 2 修复优先级

优先处理：
1. 首页 / 课程详情 / 个人页的首屏厚重问题
2. 我的教练 / 我的预约 / 通知列表的单屏信息密度
3. 帮助页与会员中心的长内容阅读节奏
