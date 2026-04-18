# Pilates Studio Mini 对齐 Figma UI 改造清单

## 目标

在保留 `F:\pilates-studio-mini` 现有小程序业务骨架、API 层和导航结构的前提下，按 `F:\figma` 的页面结构与视觉语言做高保真复刻。

> 结论：
>
> - 不建议重写项目。
> - 不建议直接搬运 Figma 导出的 React/Vite 代码。
> - 正确做法是：把 Figma 作为 UI/交互参考，在当前 Taro 小程序项目里原生重建展示层。

## 当前完成状态（更新）

截至当前版本，以下页面已完成 Figma 对齐并通过本地构建验证：

- 首页
- 预约页
- 课程详情
- 教练列表 / 教练详情
- 会员中心
- 我的预约
- 我的页
- 通知
- 帮助
- 设置
- 交易记录

已完成的基础层包括：

- `src/components/shell/*`
- `src/custom-tab-bar/*`
- `src/constants/navigation.ts`
- `src/styles/variables.scss`
- `src/styles/common.scss`

当前后续工作重心：

- 首页剩余细节验收与微调
- 真机 / 微信开发者工具逐页人工 QA
- 导航与页面壳层的持续小范围收口

---

## 复刻目标说明

- **可实现目标**：核心页面 UI 约 90%~95% 高保真复刻
- **不可直接实现目标**：Web 运行时下的 1:1 代码复用、像素级完全一致
- **主要原因**：
  - `F:\figma` 是 React + Vite + React Router + Tailwind/shadcn 风格
  - `F:\pilates-studio-mini` 是 Taro + 微信小程序运行时 + SCSS
  - 路由、DOM、组件运行机制、底部导航和浏览器特效都不兼容

---

## 一、全局设计系统层

### 1. `src/styles/variables.scss`

改造目标：

- 统一颜色 token：主文字、浅背景、卡片背景、金色强调、弱文字、分割线
- 统一圆角：按钮、卡片、标签、弹层
- 统一阴影：卡片阴影、悬浮卡阴影
- 统一字号与间距体系

说明：

- 当前项目存在视觉 token 混用情况，需要先收敛成一套更接近 Figma 的视觉基准。

### 2. `src/styles/common.scss`

改造目标：

- 补充通用类：页面容器、section 标题、卡片、胶囊标签、按钮、分隔线、状态区
- 统一空态 / 加载态 / 列表块样式

说明：

- 避免每个页面各写一套近似但不一致的卡片壳和排版规则。

### 3. `src/app.scss`

改造目标：

- 统一全局背景色、根容器滚动区、页面安全区、底部留白
- 校准 tab 页整体视觉基底

### 4. `src/app.config.ts`

改造目标：

- 补新增页面注册：
  - `pages/notifications/index`
  - `pages/help/index`
  - `pages/settings/index`
- 若后续追求更高 UI 还原度，可考虑将 tabBar 切为 `custom: true`

说明：

- Figma 风格的底部导航更接近自定义导航壳，原生 tabBar 还原度有限。

---

## 二、公共组件层

### 1. `src/components/index.ts`

改造目标：

- 统一导出新的共享壳组件和现有基础组件

### 2. 建议新增目录：`src/components/shell/`

建议新增以下组件：

#### `PageShell.tsx` / `PageShell.scss`

- 统一页面外层容器、顶部留白、底部安全区、卡片列表间距

#### `PageHeader.tsx` / `PageHeader.scss`

- 对齐 Figma 的返回头、标题、副标题、右侧操作位

#### `SectionTitle.tsx` / `SectionTitle.scss`

- 做分区标题、英文 eyebrow、副操作按钮

#### `AppCard.tsx` / `AppCard.scss`

- 做统一卡片容器，减少各页重复卡片壳

#### `AppButton.tsx` / `AppButton.scss`

- 做主按钮 / 次按钮 / 金色按钮三种主态

#### `Divider.tsx` / `Divider.scss`

- 统一轻分割线

#### `BottomNav.tsx` / `BottomNav.scss` 或 `custom-tab-bar/`

- 若要更高还原 Figma 底部导航，建议自定义 tabBar

### 3. 现有基础组件统一风格

#### `src/components/Loading/*`

- 改成更贴近 Figma 的轻量 loading 呈现

#### `src/components/Empty/*`

- 空态卡片化，增加标题/描述层级

#### `src/components/StatusTag/*`

- 对齐金色 / 中性 / 成功 / 完成等标签风格

#### `src/components/CourseCard/*`
#### `src/components/CoachCard/*`
#### `src/components/BookingItem/*`

- 统一图片比例、圆角、标题层级、meta 信息、状态角标

---

## 三、页面改造清单

### 1. 首页 `src/pages/index`

#### `src/pages/index/index.tsx`

改造目标：

- 保留现有 API 拉取逻辑
- 重构数据映射，让输出字段更贴近 Figma 页面结构
- 精简并统一各模块顺序与文案层级

#### `src/pages/index/components/HomeHero*`

- 调整问候区、日期、会员 badge、主副标题版式与字号

#### `src/pages/index/components/HomeMembershipCard*`

- 强化会员卡层级、进度条、主指标区、操作区

#### `src/pages/index/components/HomeTodayCourseCard*`

- 强化今日课程信息层级、状态、时间区和 CTA

#### `src/pages/index/components/HomeServiceBand*`

- 对齐 4 个快捷入口的图形感、色块、圆角和密度

#### `src/pages/index/components/HomeMonthlySummary*`

- 对齐数字放大逻辑、辅助指标位置、进度表达

#### `src/pages/index/components/HomeCuratedCard*`

- 做成更像内容推荐位，而不是普通课程卡

#### `src/pages/index/components/HomeUpcomingList*`

- 对齐日期结构、卡片密度、NEXT/WEEK/PLAN 标签风格

#### `src/pages/index/components/HomeStudioCard*`

- 做成更像门店信息展示卡，而不是普通信息条

#### `src/pages/index/index.scss`

- 全面跟随上面组件的间距、卡片密度、背景节奏做样式收敛

---

### 2. 预约页 `src/pages/courses`

#### `src/pages/courses/index.tsx`

改造目标：

- 这是重点页面
- 当前仍是静态壳数据，需要改成真实 API 映射
- 页面结构继续保留：
  - Hero
  - 日期条
  - 分类 pills
  - 课程卡片列表

#### `src/pages/courses/components/BookingHero*`

- 调整标题、副标题、右侧“我的预约”动作层次

#### `src/pages/courses/components/BookingDateStrip*`

- 对齐 Figma 的日期条尺寸、选中态、横向滚动节奏

#### `src/pages/courses/components/BookingCategoryPills*`

- 对齐分类胶囊样式、间距、激活态

#### `src/pages/courses/components/BookingCourseCard*`

- 对齐图片、标题、教练、门店、余位/满位状态、卡片间距

#### `src/pages/courses/index.scss`

- 统一为更轻、更高级、更接近 Figma 的预约列表页视觉

---

### 3. 课程详情页 `src/pages/course-detail`

#### `src/pages/course-detail/index.tsx`

改造目标：

- 保留真实接口逻辑
- 重排 UI 结构：
  - 顶部视觉区
  - 课程信息
  - 教练信息卡
  - 描述区
  - 场次列表
  - 底部固定预约按钮

#### `src/pages/course-detail/index.scss`

- 重点做详情页信息层级和底部固定 CTA

---

### 4. 教练列表 / 教练详情

> Figma 没有强对应页，但这两页属于现有业务，建议做成同一产品家族风格，而不是生搬硬套。

#### `src/pages/coaches/index.tsx`
#### `src/pages/coaches/index.scss`

- 让列表卡片风格融入 Figma 语言：统一间距、卡片壳、头像/标题/标签层级

#### `src/pages/coach-detail/index.tsx`
#### `src/pages/coach-detail/index.scss`

- 对齐详情页信息卡结构，让它属于同一套品牌语言

---

### 5. 会员页 `src/pages/membership`

#### `src/pages/membership/index.tsx`

改造目标：

- 保留接口
- UI 重排成更接近 Figma 的结构：
  - 顶部会员卡
  - 权益列表
  - 概览数字
  - 活动记录

#### `src/pages/membership/index.scss`

- 会员页是高价值视觉页，要重点做金色强调和卡片层级

---

### 6. 我的预约页 `src/pages/my-bookings`

#### `src/pages/my-bookings/index.tsx`

改造目标：

- 保留分页、下拉刷新、取消预约逻辑
- 改 tabs 样式、列表密度、状态标签和空态

#### `src/pages/my-bookings/index.scss`

- 对齐 Figma 的 tab、卡片、状态块、空态表达

---

### 7. 个人中心页 `src/pages/profile`

#### `src/pages/profile/index.tsx`

改造目标：

- 保留资料拉取逻辑
- 把菜单项真正接到新页面
- “训练记录”不要再临时指向 `my-bookings`
- 菜单结构继续保留 SERVICE / SUPPORT，但要把 UX 做完整

#### `src/pages/profile/components/ProfileAccountCard*`

- 对齐头像、GOLD/GUEST badge、统计行排版

#### `src/pages/profile/components/ProfileMenuSection*`

- 菜单卡片、分组标题、图标、说明文案、箭头区统一

#### `src/pages/profile/components/ProfileSignOutButton*`

- 对齐更完整的安全退出区块风格

#### `src/pages/profile/index.scss`

- 统一个人中心整体密度和留白

---

### 8. 交易记录页 `src/pages/transactions`

> Figma 没有完全对等页，但这是现有业务页，建议按同风格扩展。

#### `src/pages/transactions/index.tsx`
#### `src/pages/transactions/index.scss`

- 做成和会员页/预约页一致的卡片化账单页
- 强化 summary card + transaction list 的视觉统一性

---

## 四、需要新增的页面

### 1. `src/pages/notifications/index.tsx`
### 2. `src/pages/notifications/index.scss`

实现内容：

- 通知列表
- 未读 / 已读分组
- 全部已读
- 课程提醒 / 系统通知 / 会员消息三类样式

### 3. `src/pages/help/index.tsx`
### 4. `src/pages/help/index.scss`

实现内容：

- FAQ 分类
- 折叠问答
- 反馈输入
- 联系方式

### 5. `src/pages/settings/index.tsx`
### 6. `src/pages/settings/index.scss`

实现内容：

- 通知设置
- 偏好设置
- 生物识别 / 语言 / 深色模式
- 清缓存
- 关于
- 退出 / 注销确认区

---

## 五、逻辑层策略

### 尽量保留不动的文件

- `src/api/request.ts`
- `src/api/bookings.ts`
- `src/api/courses.ts`
- `src/api/coaches.ts`
- `src/api/members.ts`
- `src/api/membershipPlans.ts`
- `src/api/transactions.ts`

说明：

- 核心策略是 **保留业务层，重做展示层**。
- 只在新页面真正需要时补充 API 适配，不重写已有接口层。

---

## 六、不能直接照搬的 Figma 导出部分

以下内容不能直接复制到 Taro 小程序项目中：

- `react-router` 路由实现
- Tailwind class 直接复用
- shadcn/radix 组件直接复用
- Web 专属 DOM 结构与浏览器交互
- Web 环境的模糊、hover、部分阴影与滚动手感

正确做法：

- 抽取 Figma 的 **视觉层级、页面结构、信息密度、设计 token**
- 在当前小程序项目里用 Taro + React + SCSS 原生重建

---

## 七、推荐施工顺序

### 第一阶段：基础层

1. `src/styles/variables.scss`
2. `src/styles/common.scss`
3. `src/app.scss`
4. 公共壳组件

### 第二阶段：核心主页面

5. `src/pages/index`
6. `src/pages/courses`
7. `src/pages/course-detail`
8. `src/pages/membership`
9. `src/pages/my-bookings`
10. `src/pages/profile`

### 第三阶段：补齐缺失页面

11. `src/pages/notifications`
12. `src/pages/help`
13. `src/pages/settings`

### 第四阶段：品牌统一扩展页

14. `src/pages/coaches`
15. `src/pages/coach-detail`
16. `src/pages/transactions`

---

## 八、阶段性完成标准

### 第一阶段完成标准

- 全局 token 统一
- 卡片 / 按钮 / 标题 / 标签样式统一
- 页面底色、安全区、滚动壳统一

### 第二阶段完成标准

- 首页、预约页、课程详情、会员页、我的预约、个人中心达到主要视觉对齐
- 关键页面 UI 还原度达到约 90%+

### 第三阶段完成标准

- 通知、帮助、设置页面补齐并可跳转
- 个人中心菜单闭环可用

### 第四阶段完成标准

- 教练和交易页融入统一品牌语言
- 整体产品视觉一致，不再出现明显“旧页 / 新页”割裂

---

## 九、一句话执行原则

**保留 API 和业务骨架，重建公共壳和页面展示层；以 Figma 为视觉标准，以 Taro 小程序为真实实现载体。**
