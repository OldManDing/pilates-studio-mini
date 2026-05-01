# 小程序 + 后台 UI 问题清单（30+）

> 场景：有真实数据、模拟登录可用的前提下，针对小程序与后台 UI 的问题清单。
> 说明：本清单混合“已复现问题”和“高概率问题候选（基于代码证据）”，用于后续逐条修复与回归。

## 字段说明

- **状态**：Confirmed（已复现）/ Candidate（候选）
- **严重级别**：High / Medium / Low

## 问题列表（共 35 条）

| ID | 端 | 状态 | 严重级别 | 页面/模块 | 问题描述 | 代码证据 | 复现提示 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MINI-001 | 小程序 | Resolved | High | 开发登录链路 | 开发工具下 `Taro.login()` 超时导致无法进入数据态 | `src/api/auth.ts`（`USE_MINI_OPEN_ID_LOGIN` 直走 openId） | 已通过开发假登录路径稳定进入数据态 |
| MINI-002 | 小程序 | Resolved | High | 网络配置 | 真机/工具环境切换时 API 基址混用导致“网络连接失败” | `src/api/auth.ts` `getRuntimeApiBaseUrl()`；`config/index.js` | 已按 devtools/真机分流 API 基址，联调链路稳定 |
| MINI-003 | 小程序 | Resolved | Medium | 请求层错误提示 | 原始“网络连接失败”提示过于泛化，不利于定位 | `src/api/request.ts` catch 分支 | 已区分合法域名/超时/服务不可达/证书失败等提示 |
| MINI-004 | 小程序 | Resolved | Medium | 首页问候语 | 用户名默认追加“女士”可能误称呼 | `src/pages/index/index.tsx` `getDisplayMemberName` | 已改为显示原始会员名，不再强制追加性别称谓 |
| MINI-005 | 小程序 | Resolved | High | 首页门店信息 | 门店名称/地址/营业时间硬编码，和真实后端门店配置不一致 | `src/pages/index/index.tsx` + `src/api/settings.ts` + `backend/src/modules/settings/settings.controller.ts` | 已改为读取 `/settings/studio` 实时数据并展示 |
| MINI-006 | 小程序 | Resolved | Medium | 首页课程信息 | 课程卡附带“朝阳门店”硬编码，易误导 | `src/pages/index/index.tsx` | 已改为展示后端门店名（无数据时显示“门店待更新”） |
| MINI-007 | 小程序 | Resolved | Medium | 月度进度 | 月目标固定按16节计算，不符合个性化目标 | `src/pages/index/index.tsx` | 已改为根据会籍总课次与有效期推导月目标，再计算完成率 |
| MINI-008 | 小程序 | Resolved | Medium | 首页近期安排 | routeUrl 缺失时点击无反馈 | `src/pages/index/index.tsx` | 已在无 routeUrl 时给出“当前课程详情暂不可用”提示 |
| MINI-009 | 小程序 | Resolved | Medium | 课程筛选 | 分类映射基于 imageKind，新增课程类型可能错误归类 | `src/pages/courses/index.tsx` | 已增加“其他”分类并将未知类型归入其他，避免误归类 |
| MINI-010 | 小程序 | Resolved | Medium | 课程时间范围 | 日期筛选仅 7 天，超过范围课程不可筛 | `src/pages/courses/index.tsx` | 已扩展为 14 天日期条，覆盖第8天及之后排课 |
| MINI-011 | 小程序 | Resolved | High | 课程详情预约 | 只允许预约最早场次，无法选其他可约场次 | `src/pages/course-detail/index.tsx` | 已改为支持多场次选择（ActionSheet）后再预约 |
| MINI-012 | 小程序 | Resolved | Medium | 教练详情缺参 | 未带 id 进入详情页缺少恢复操作按钮 | `src/pages/coach-detail/index.tsx` | 已补“返回教练列表”恢复按钮 |
| MINI-013 | 小程序 | Resolved | Low | 教练详情邮箱 | 复制邮箱无成功反馈 | `src/pages/coach-detail/index.tsx` | 已增加复制成功 toast 反馈 |
| MINI-014 | 小程序 | Resolved | High | 我的预约分页 | PENDING/CONFIRMED、CANCELLED/NO_SHOW 合并分页可能偏斜 | `src/pages/my-bookings/index.tsx` | 已改为按状态全量聚合后统一分页，避免偏斜 |
| MINI-015 | 小程序 | Resolved | Medium | 我的预约统计 | tab 切换后显示总数语义可能与当前 tab 不一致 | `src/pages/my-bookings/index.tsx` | 已改为显示当前 tab 的全量总数（非当前分页长度） |
| MINI-016 | 小程序 | Resolved | High | 通知列表 | 固定 limit=50，无分页/加载更多 | `src/pages/notifications/index.tsx` | 已补分页与上拉加载更多 |
| MINI-017 | 小程序 | Resolved | Low | 通知时间 | 时间格式不带年份，跨年消息易歧义 | `src/pages/notifications/index.tsx` | 已改为跨年场景显示 `YYYY.MM.DD`，已读日期统一带年份 |
| MINI-018 | 小程序 | Resolved | High | 会员统计口径 | “累计小时”按课次估算，非真实训练时长 | `src/pages/membership/index.tsx` | 已改为基于 COMPLETED 预约真实起止时间累加时长 |
| MINI-019 | 小程序 | Resolved | Medium | 当前会员选择 | 无有效会籍时回退到首条历史记录，可能误导 | `src/pages/membership/index.tsx` | 已取消历史首条回退，仅展示有效/生效会籍，否则显示待开通 |
| MINI-020 | 小程序 | Resolved | Medium | 续费页同步 | loadFailed 且有旧 plans 时仍可继续提交旧方案 | `src/pages/membership-renew/index.tsx` | 已在 loadFailed 时禁用提交并提示先同步最新方案 |
| MINI-021 | 小程序 | Resolved | Medium | 设置-清缓存 | 文案“清缓存”与实际只删两个 key 不匹配 | `src/pages/settings/index.tsx` | 已明确文案为“清理页面缓存”，并提示“页面缓存已清理” |
| MINI-022 | 小程序 | Resolved | Low | 设置危险操作 | 退出/注销确认使用 `View` 模拟按钮，交互语义弱 | `src/pages/settings/index.tsx` | 已改为 `Button` 语义控件并保留原交互样式 |
| MINI-023 | 小程序 | Resolved | High | 我的教练汇总 | 教练匹配使用 name 兜底，重名会串数据 | `src/pages/my-coaches/index.tsx` | 已改为仅按 coach.id 匹配 |
| MINI-024 | 小程序 | Resolved | Medium | PageHeader 语义 | 返回控件为 View 而非 Button，语义和态不完整 | `src/components/shell/PageHeader/index.tsx` | 已改为 `Button` 返回控件并补样式重置 |
| MINI-025 | 小程序 | Resolved | High | API 详情授权 | `/bookings/:id` mini user 详情权限原先被拒绝 | `backend/src/modules/bookings/*` | 已放开 mini user 详情入口并增加归属校验 |
| MINI-026 | 小程序 | Resolved | High | API 详情授权 | `/transactions/:id` mini user 详情权限原先被拒绝 | `backend/src/modules/transactions/*` | 已放开 mini user 详情入口并增加归属校验 |
| ADM-001 | 后台 | Resolved | Medium | CRUD 弹窗 | members/courses/bookings/coaches 新增弹窗曾触发 `useForm` warning | `src/pages/{members,courses,bookings,coaches}/index.tsx` | 已统一 `forceRender`，warning 消失 |
| ADM-002 | 后台 | Resolved | High | 仪表盘统计 | 仅取 bookings 前 100 条计算今日/异常统计，可能低估 | `src/pages/dashboard/index.tsx` | 已改为按分页拉全量后统计 |
| ADM-003 | 后台 | Resolved | Medium | 仪表盘语义 | “今日执行队列”在空场景下回退未来数据，语义混淆 | `src/pages/dashboard/index.tsx` | 已移除非今日回退，空场景展示“今日执行队列为空” |
| ADM-004 | 后台 | Resolved | High | 预约新增 | 新增预约会员下拉只加载前100会员 | `src/pages/bookings/index.tsx` | 已改为分页拉全量会员用于下拉 |
| ADM-005 | 后台 | Resolved | Medium | 预约状态流转 | 非 PENDING/CONFIRMED 状态也可能被主按钮改回 PENDING | `src/pages/bookings/index.tsx` | 已改为终态仅查看详情，不再回滚状态 |
| ADM-006 | 后台 | Resolved | Medium | 搜索请求抖动 | bookings 搜索每个字符触发请求，无 debounce | `src/pages/bookings/index.tsx` | 已加防抖输入态，降低请求频率 |
| ADM-007 | 后台 | Resolved | Medium | 课程筛选稳定性 | 课程 type 自由输入，筛选/统计长期碎片化 | `src/pages/courses/index.tsx` | 新增/编辑改为标准类型下拉（兼容现有类型），降低碎片化 |
| ADM-008 | 后台 | Resolved | Medium | 搜索请求抖动 | courses 搜索每字符请求，无 debounce | `src/pages/courses/index.tsx` | 已加防抖输入态，降低请求频率 |
| ADM-009 | 后台 | Resolved | Medium | 搜索请求抖动 | coaches 搜索每字符请求，无 debounce | `src/pages/coaches/index.tsx` | 已加防抖输入态，降低请求频率 |
| ADM-010 | 后台 | Resolved | High | 财务时间窗 | 财务页仅近6个月，历史交易被截断 | `src/pages/finance/index.tsx` | 已改为分页拉取全量交易，不再按6个月硬截断 |
| ADM-011 | 后台 | Resolved | Medium | 财务月维度 | 月趋势 key 仅“X月”，跨年同月数据混合 | `src/pages/finance/index.tsx` | 已改为 `YYYY-MM` 月维度，避免跨年合并 |
| ADM-012 | 后台 | Resolved | Medium | 财务搜索口径 | 金额按 cents/日期按 ISO 搜索，与界面展示口径不一致 | `src/pages/finance/index.tsx` | 已补充按“元金额/格式化金额”搜索匹配 |
| ADM-013 | 后台 | Resolved | Medium | 待处理续费 | “待处理续费”仅取100条，忙时不完整 | `src/pages/finance/index.tsx` | 已改为分页拉取全量待处理续费记录 |
| ADM-014 | 后台 | Resolved | High | 登录重定向 | 本地 token 存在即跳转，未先校验有效性 | `src/pages/login/index.tsx` | 已增加 `authApi.getMe()` 校验，失效 token 清理后停留登录页 |
| ADM-015 | 后台 | Resolved | Medium | 权限编辑体验 | roles 抽屉关闭时无脏数据提示，改动易丢失 | `src/pages/roles/index.tsx` | 已增加未保存改动确认弹窗，避免误关丢失 |
| ADM-016 | 后台 | Resolved | Medium | 可访问性 | 侧边栏键盘仅 Enter，不支持 Space | `src/components/AppSidebar/index.tsx` | 已支持 Space/Enter 一致触发导航 |
| ADM-017 | 后台 | Resolved | Medium | 数据恢复风险 | settings 数据恢复仅按 .json 限制，无 schema/体积前校验 | `src/pages/settings/index.tsx` | 已增加扩展名/体积/JSON结构/必需字段前置校验 |
| ADM-018 | 后台 | Resolved | Low | 地址格式 | 门店地址拼接无分隔符，可读性差 | `src/pages/settings/index.tsx` | 已增加省市区与详细地址分隔空格，提升可读性 |
| ADM-019 | 后台 | Resolved | Low | 周期筛选语义 | 预约周期按钮缺少 aria-pressed 等语义信息 | `src/pages/bookings/components/BookingPeriodSelector.tsx` | 已补 `aria-pressed`/分组 `aria-label` 语义 |
| ADM-020 | 后台 | Resolved | Medium | 导航语义 | 仪表盘与二级快捷页“今日/近期”文案与实际回退逻辑可能冲突 | `src/pages/dashboard/*` | 已移除“今日执行”非今日回退并明确“今日/未来”区块文案 |

## 快速优先级建议

当前清单 35/35 已进入 **Resolved**。

下一轮建议：
- 执行真机专项回归（同网段、弱网、跨年通知样本）并补截图证据。
- 做一次无障碍专项走查（键盘路径、读屏语义、焦点顺序）。
- 将本清单从“问题追踪”切换为“回归基线”，用于后续发布门禁。
