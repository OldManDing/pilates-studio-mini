# 小程序 UI 测试 Round 1 问题清单（2026-05-01）

## 测试范围

- 项目：`F:\pilates-studio-mini`
- 目标：首轮 UI 质量盘点，聚焦布局、间距、字号、颜色、组件一致性、交互状态、空态/加载态/错误态、长内容态与适配
- 方法：代码审查 + 构建门禁 + 断点运行态抽样（390 / 430 宽）

## 基线验证

- `npm run typecheck` 通过
- `npm run test:smoke` 通过
- `npm run build:weapp` 通过

## 问题清单（Round 1）

| ID | 级别 | 问题 | 锚点 |
|---|---|---|---|
| M1-001 | P1 | `PageShell` 为 tab 页预留的底部空间固定为 `$tabbar-reserved-height=144px`，而自定义 tabbar 实际内边距是 `28px + safe area`，存在部分机型底部留白过大/内容被顶起的适配风险 | `src/components/shell/PageShell/index.scss:32-36`, `src/custom-tab-bar/index.scss:18-25`, `src/styles/variables.scss:165-166` |
| M1-002 | P1 | `Loading` 组件 compact 态固定 `min-height: 280px`，在短内容页面中会造成 Loading → 内容切换时明显跳屏 | `src/components/Loading/index.scss:13-29` |
| M1-003 | P1 | `Empty` 组件 action 按钮设置 `min-width: 196px`，在窄卡片/短容器内容易显得过宽，破坏按钮密度一致性 | `src/components/Empty/index.scss:61-71` |
| M1-004 | P1 | 首页 hero 标题和副标题字号偏大且 subtitle 限宽 `82%`，小屏下容易出现标题/摘要占比失衡，首屏信息密度不稳定 | `src/pages/index/index.scss:142-156` |
| M1-005 | P1 | 首页会员卡主卡片使用大内边距 `32px 40px 24px` 和大号指标字体，390 宽下内容显得偏挤，纵向占高过重 | `src/pages/index/index.scss:159-319` |
| M1-006 | P1 | 首页 notice 操作按钮设置 `min-width: 168px`，在短提示文案或多按钮场景下灵活性不足 | `src/pages/index/index.scss:27-34` |
| M1-007 | P1 | 课程页 sticky 过滤区通过负 margin + 模糊背景实现悬浮，滚动时存在覆盖正文顶部内容的风险，且层级与留白较重 | `src/pages/courses/index.scss:10-25` |
| M1-008 | P1 | 课程卡片地点文案写死为“朝阳门店”，与真实门店设置脱节，属于明显的错误回显/假数据 UI 问题 | `src/pages/courses/index.tsx:184-186` |
| M1-009 | P1 | 课程卡片 footer 的 `教练 + 地点` 文案没有截断/换行策略，长教练名或长地点时会挤压右侧名额与箭头区域 | `src/pages/courses/components/BookingCourseCard.tsx:33-43` |
| M1-010 | P1 | 课程详情页 hero 区固定 `42vh` 且 `min-height: 320px`，在小屏机型上首屏图片区占比过大，正文被压到首屏下方 | `src/pages/course-detail/index.scss:14-20` |
| M1-011 | P1 | 课程详情页正文容器固定左右 padding 为 `$figma-page-x`，小屏下可读宽度偏窄，长文案阅读效率下降 | `src/pages/course-detail/index.scss:92-99` |
| M1-012 | P1 | 教练详情页电话/邮箱值强制 `nowrap + ellipsis` 且 `max-width: 65%`，长邮箱会被截断，关键信息不可完整感知 | `src/pages/coach-detail/index.scss:148-176` |
| M1-013 | P1 | 教练详情页 hero 与信息卡使用较大固定尺寸（84px 头像、30px 标题），在 390 宽下竖向密度偏重 | `src/pages/coach-detail/index.scss:61-90`, `103-125`, `132-146` |
| M1-014 | P1 | 个人页账户卡使用大 padding（49px / 56px）和大指标字号（35px），小屏下纵向节奏偏松、信息过于稀疏 | `src/pages/profile/index.scss:60-111`, `208-261` |
| M1-015 | P1 | 个人页菜单项使用 `31px 49px` 大 padding，并且“登录后查看”提示与标题描述并排，易造成窄屏信息拥挤 | `src/pages/profile/index.scss:287-318` |
| M1-016 | P1 | 会员中心在无会员时展示伪造编码 `LIN-0000-0000`，会造成明显假数据观感，不符合上线体验 | `src/pages/membership/index.tsx:243-251` |
| M1-017 | P1 | 会员中心多个数值/状态区域字号和留白偏大，整体内容块在 390 宽下显得过厚重，首屏可见信息不足 | `src/pages/membership/index.scss:22-75`, `147-189`, `270-325` |
| M1-018 | P1 | 通知列表项使用 `35px 49px` 大 padding 和 63px 图标，列表密度偏低，单屏可见消息条数偏少 | `src/pages/notifications/index.scss:95-110`, `130-156` |
| M1-019 | P1 | 通知标题未做多行限制，长标题可能挤压右侧时间区域，阅读节奏不稳定 | `src/pages/notifications/index.scss:167-215` |
| M1-020 | P1 | 设置页 value 文案统一 `max-width: 42%` + `nowrap + ellipsis`，手机号/版本号/语言等值容易过早截断 | `src/pages/settings/index.scss:126-136` |
| M1-021 | P1 | 设置页 about 区 value 同样 `max-width: 48%` + `ellipsis`，版本号和较长文案显示不完整 | `src/pages/settings/index.scss:188-198` |
| M1-022 | P1 | 帮助页 FAQ 答案行高固定 `35px` 且字号较大，长答案展开后纵向体量过大、阅读效率偏低 | `src/pages/help/index.scss:128-145` |
| M1-023 | P1 | 帮助页反馈输入框固定 `min-height: 245px` 与 `line-height: 38px`，在小屏设备上占比过大，影响提交区触达 | `src/pages/help/index.scss:293-305` |
| M1-024 | P1 | 消费记录页的交易类型/日期/编号全部 `nowrap + ellipsis`，长交易码与完整时间戳被过度截断 | `src/pages/transactions/index.scss:83-102` |
| M1-025 | P1 | 我的预约页课程名与元信息全部单行省略，长课程名/长教练名在小屏下信息损失较明显 | `src/pages/my-bookings/index.scss:166-223` |
| M1-026 | P1 | 我的教练页 hero 数值 `64px`、描述 `22px/34px`，首屏内容显得偏重，且与其他页面字号体系不够协调 | `src/pages/my-coaches/index.scss:18-38` |
| M1-027 | P1 | 我的教练列表描述没有截断规则，长专长组合文案可能造成卡片高度和右侧统计失衡 | `src/pages/my-coaches/index.scss:95-118`, `src/pages/my-coaches/index.tsx:145-150` |

## Round 1 修复优先级

优先处理：
1. 假数据与错误回显：M1-008, M1-016
2. 小屏关键信息截断：M1-009, M1-012, M1-020, M1-021, M1-024, M1-027
3. 过厚重布局与首屏占高：M1-010, M1-018, M1-023
