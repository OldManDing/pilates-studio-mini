# 小程序 Figma 高保真重建方案

## 文档目的

本文档用于记录当前 `D:\pilates-studio-mini` 与目标 Figma 设计稿之间的主要差距，并明确后续不再继续对旧页面做零碎修补，而是基于 `D:\miniProgram` 的页面结构重新实现三大主页面的静态 UI 外壳。

目标页面仅限三大主页面：

1. 首页
2. 预约页
3. 我的页

---

## 目标项目与视觉真相来源

- 目标项目：`D:\pilates-studio-mini`
- 视觉真相来源：你提供的 Figma 设计稿截图
- 结构参考来源：`D:\miniProgram`

重要原则：

1. Figma 截图优先于当前代码实现
2. Figma 导出代码只用于结构参考，不能直接当成最终视觉标准
3. 本轮只做静态 UI 高保真还原，不接 API、不改业务逻辑、不改数据结构
4. 优先保证视觉还原度，其次才考虑代码抽象

---

## 当前实现与 Figma 的核心差距

### 首页

| 维度 | 当前问题 | 与 Figma 的差异 | 精确修改建议 |
|---|---|---|---|
| 整体布局 | 结构已接近，但仍偏“功能型首页” | Figma 更克制、更安静、更像精品页 | 维持现有模块顺序，整体重写外壳节奏和卡片尺寸 |
| 顶部区域 | Hero 区仍略重 | Figma 顶部更轻，装饰更少 | 压缩顶部高度，降低背景装饰存在感 |
| Membership 卡 | 数据结构已具备，但卡片比例和排版仍不够像 | Figma 的数值、进度条、按钮关系更稳定 | 以 Figma 卡片版式重写为主，不保留旧卡布局习惯 |
| 今日课程卡 | 结构接近，但按钮、meta、状态仍带产品实现痕迹 | Figma 更克制，信息顺序更固定 | 重写卡片头部、按钮区、状态点和说明层级 |
| 服务导航带 | 已较接近，但仍像自定义实现 | Figma 的 4 宫格更轻、更整齐 | 直接按 Figma 四列 band 重新排版 |
| 本月训练 | 指标已接入，但表达偏“数据卡” | Figma 更偏信息雕刻感 | 重写为更接近截图的左大右小结构 |
| 精选推荐 | 当前图像和 CTA 仍像实现替代品 | Figma 更像编辑推荐卡 | 重新做图像区和下方文案区 |
| 近期安排 | 列表已存在，但密度和箭头细节不足 | Figma 更轻、更细、更规整 | 重写 item 结构、日期列、右箭头、tag |
| 门店卡 | 已有黑卡，但 icon 与按钮质感仍不够像 | Figma 更纯净、更高级 | 重新做 pin icon、按钮边框、白字透明度 |

### 预约页

| 维度 | 当前问题 | 与 Figma 的差异 | 精确修改建议 |
|---|---|---|---|
| 顶部头部 | 已接近，但字距/留白仍不够准 | Figma 更轻、更短 | 重新固定头部高度与标题层级 |
| 日期条 | 已收窄，但仍有工具页感 | Figma pills 更细、更短、更轻 | 完整按 Figma 尺寸重做 date pills |
| 分类 pills | 仍略厚 | Figma 是更薄的 capsule | 统一 pills 高度、边框、激活态 |
| 卡片缩略图 | 现在更像“产品实现图” | Figma 的缩略图区更统一、像精选内容 | 重新设计 thumb 区尺寸与图片策略 |
| 卡片文字层级 | 仍稍偏大 | Figma 标题、时间、meta 更轻 | 降低字号与对比度，压缩 card 内间距 |
| 列表密度 | 三页里最重 | Figma 更轻薄 | 进一步压 card padding 和块间距 |

### 我的页

| 维度 | 当前问题 | 与 Figma 的差异 | 精确修改建议 |
|---|---|---|---|
| 资料卡 | 已较接近 | Figma 更轻、更统一 | 继续微调头像、badge、stats 比例 |
| SERVICE / SUPPORT 卡 | 已接近 | 仍带一点实现痕迹 | 用更精确的内边距和 icon 尺寸重写 |
| icon 语义 | 目前已从字符改善，但仍不是真正高保真 | Figma 是统一的轻图标语言 | 统一一套静态 icon 方案 |
| 退出按钮 | 已可用 | 与 Figma 比仍稍重 | 用更细边框、更轻 icon 和字重处理 |

---

## 结论：为什么不再继续修旧页面

虽然当前三页已经进入“可接受版”，但从高保真目标看，继续在旧页面结构上补丁式修改会有三个问题：

1. 旧页面内部已经掺杂多轮实现痕迹，视觉不够纯净
2. 旧结构天然带着功能页逻辑，不利于做出 Figma 的克制感
3. 越往后修，越容易陷入“差一点像”的状态，而不是直接接近目标稿

所以后续应该切换方案：

> 基于 Figma 主页面结构重新实现静态 UI 外壳，再为后续逻辑接入预留映射点。

---

## 新的页面拆分方案

### 首页

目标文件：

- `src/pages/index/index.tsx`
- `src/pages/index/index.scss`

建议新增组件：

- `src/pages/index/components/HomeHero.tsx`
- `src/pages/index/components/HomeMembershipCard.tsx`
- `src/pages/index/components/HomeTodayCourseCard.tsx`
- `src/pages/index/components/HomeServiceBand.tsx`
- `src/pages/index/components/HomeMonthlySummary.tsx`
- `src/pages/index/components/HomeCuratedCard.tsx`
- `src/pages/index/components/HomeUpcomingList.tsx`
- `src/pages/index/components/HomeStudioCard.tsx`

### 预约页

目标文件：

- `src/pages/courses/index.tsx`
- `src/pages/courses/index.scss`

建议新增组件：

- `src/pages/courses/components/BookingHero.tsx`
- `src/pages/courses/components/BookingDateStrip.tsx`
- `src/pages/courses/components/BookingCategoryPills.tsx`
- `src/pages/courses/components/BookingCourseCard.tsx`

后续旧逻辑接入映射：

- `coursesApi.getAll()` → `BookingCourseCardData[]`
- 日期状态 → `BookingDateItemData.active`
- 分类状态 → `BookingCategoryItemData.active`
- `course.sessions` → 每张预约卡的 `time / duration / spotsText`
- `course.coach` → `instructor`
- `course.capacity / bookedCount` → 余位与“已约满”状态

### 我的页

目标文件：

- `src/pages/profile/index.tsx`
- `src/pages/profile/index.scss`

建议新增组件：

- `src/pages/profile/components/ProfileHeroCard.tsx`
- `src/pages/profile/components/ProfileStatsStrip.tsx`
- `src/pages/profile/components/ProfileMenuSection.tsx`
- `src/pages/profile/components/ProfileSignoutButton.tsx`

后续旧逻辑接入映射：

- `membersApi.getProfile()` → `ProfileAccountCardData`
- `membersApi.getMyMemberships()` → `badge / meta / account status`
- `bookingsApi.getMyBookings()` → `stats[0]`（累计课程）
- 加入时间 / 累计训练时长 → `ProfileAccountCardData.stats`
- 菜单跳转配置 → `ProfileMenuSectionData`
- 退出登录逻辑 → `ProfileSignOutButton.onClick`

---

## 静态 UI 实现原则

1. 首先把结构、留白、字体层级、卡片样式做准
2. 数据全部用静态占位，不接真实接口
3. 只给后续逻辑预留 props 与映射位，不在这轮绑定真实请求
4. 所有按钮、卡片、标签、分隔线、图标都以截图为标准

---

## 后续接入旧逻辑的映射说明

### 首页映射

- `membersApi.getProfile()` → `HomeHero.name`
- `membersApi.getMyMemberships()` → `HomeMembershipCard`
- `bookingsApi.getMyBookings()` → `HomeTodayCourseCard`、`HomeUpcomingList`
- `coursesApi.getAll()` → `HomeCuratedCard`

#### 首页组件级映射

- `HomeHero`
  - `membersApi.getProfile()` → `title / subtitle / badgeLabel / profileCta`
- `HomeMembershipCard`
  - `membersApi.getMyMemberships()` 当前激活卡 → `planName / metric / progress / CTA`
- `HomeTodayCourseCard`
  - `bookingsApi.getMyBookings()` 最近一条预约 → `timeRange / title / meta / note`
- `HomeServiceBand`
  - 保持静态导航配置，后续仅接 `route` / `actionKey`
- `HomeMonthlySummary`
  - `bookingsApi.getMyBookings()` 本月 `COMPLETED` 聚合 → `value / sideItems / progressText`
- `HomeCuratedCard`
  - `coursesApi.getAll()` 结果映射 → `title / description / meta / image`
- `HomeUpcomingList`
  - `bookingsApi.getMyBookings()` 未来记录 → `day / weekday / label / title / meta`
- `HomeStudioCard`
  - 后续门店静态配置或 settings 接口 → `name / address / hours / note`

### 预约页映射

- `coursesApi.getAll()` / `course.sessions` → `BookingCourseCard`
- 日期选择状态 → `BookingDateStrip.activeDate`
- 类型选择状态 → `BookingCategoryPills.activeType`

#### 预约页组件级映射

- `BookingHero`
  - 静态标题区，后续仅保留“我的预约”入口事件映射
- `BookingDateStrip`
  - 本地 7 日日期数组 → `items`
  - 选择状态 → `active`
- `BookingCategoryPills`
  - 当前过滤类型 → `active`
  - 后续与 `CourseTypes` 或自定义分类映射
- `BookingCourseCard`
  - `coursesApi.getAll()` 结果映射成单卡 view model
  - `course.sessions` → `time / duration / spotsText`
  - `course.coach.name` → `instructor`
  - `course.capacity / bookedCount` → 余位与“已约满”状态

### 我的页映射

- `membersApi.getProfile()` → `ProfileHeroCard`
- `bookingsApi.getMyBookings()` → `ProfileStatsStrip`
- 会员数据 → `ProfileHeroCard.badge / meta`

#### 我的页组件级映射

- `ProfileAccountCard`
  - `membersApi.getProfile()` → `avatar / name / phone`
  - `membersApi.getMyMemberships()` → `badge / account status`
  - `bookingsApi.getMyBookings()` / 本地统计 → `stats`
- `ProfileMenuSection`
  - 当前固定的 SERVICE / SUPPORT 菜单配置，后续只接 route/action
- `ProfileSignOutButton`
  - 继续承接现有退出逻辑

---

## 当前实施状态

截至当前会话，三大主页面的新静态壳均已落地：

1. 首页新静态壳：已完成
2. 预约页新静态壳：已完成
3. 我的页新静态壳：已完成

并且小程序已通过：

- `npm run build:weapp`

这意味着后续工作不再是“重做 UI 外壳”，而是：

1. 逐页把旧逻辑映射到新组件 props
2. 在不破坏 Figma 结构的前提下替换静态占位数据
3. 最后补 runtime/联调问题

---

## 下一步建议

后续不要继续在旧页面里一点点 patch，而应该：

1. 先以首页为试点，按新拆分重做静态壳
2. 验证视觉方向完全正确后，再做预约页
3. 最后做我的页

这样更容易达到“尽量和 Figma 一样”的目标，而不是继续停留在“当前最好版”。
