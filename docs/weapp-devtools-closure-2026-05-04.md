# WeChat DevTools 小程序实测闭环报告

生成时间：2026-05-04 00:52（Asia/Shanghai）

## 测试对象

- 项目目录：`F:\pilates-studio-mini`
- 小程序构建目录：`F:\pilates-studio-mini\dist`
- 微信开发者工具项目：`F:\pilates-studio-mini\dist`
- 自动化端口：`ws://127.0.0.1:9422`
- IDE HTTP 端口：`http://127.0.0.1:9421`
- 模拟器：iPhone 15 Pro Max
- 平台：devtools
- SDKVersion：3.15.2
- 微信版本：8.0.5

## 本轮补查范围

- 页面：`dist/app.json` 注册的 18 个页面全部 `reLaunch` 检查。
- 模块：课程、教练、会员、续费、预约、训练记录、我的教练、个人中心、通知、帮助、设置、安全、协议、隐私、交易。
- 功能入口：3 个 tab 入口 `首页 / 预约 / 我的` 全部 `switchTab` 检查。
- 核心流程：课程列表、课程详情、教练列表、教练详情、会员权益、续费页、我的预约、交易记录、设置页。
- 接口调用：本地后端 `http://127.0.0.1:3000/api` 通过 `npm run test:api` 验证。
- 数据回显：模拟器读取页面根节点文本，检查空文本、错误占位、`undefined/null/NaN/[object Object]`。
- 状态流转：详情页缺参、详情页真实 ID、tab 切换、页面重建后的显示状态。
- 空态 / 加载态 / 错误态：重点补查课程详情、教练详情缺参空态和真实 ID 正常态。
- 同类组件 / 同类交互：课程详情与教练详情两个详情页同类缺参入口一起修复。

## 本轮新增发现问题清单

| ID | 问题 | 是否复现 | 根因 | 当前状态 |
| --- | --- | --- | --- | --- |
| WMP-2026-05-04-01 | `/pages/course-detail/index` 未携带 `id` 时误显示“课程加载失败/网络异常” | 已复现 | `useLoad` 缺少 `id` 时把 `courseLoadFailed` 设置为 `true`，把路由参数缺失误归类为网络/接口失败 | 已解决 |
| WMP-2026-05-04-02 | `/pages/coach-detail/index` 未携带 `id` 时只显示“教练不存在”，缺少明确的缺参说明 | 已复现 | 教练详情页没有独立的 `coachIdMissing` 状态，缺参入口和资源不存在状态没有区分 | 已解决 |

## 已解决问题清单

### WMP-2026-05-04-01 课程详情缺参误报加载失败

- 复现方式：微信开发者工具自动化执行 `reLaunch('/pages/course-detail/index')`。
- 修复文件：`src/pages/course-detail/index.tsx`
- 修复方式：新增 `courseIdMissing` 状态；缺少 `id` 时展示“课程信息缺失”；只有真实接口失败且存在 `courseId` 时才展示“重新加载”。
- 为什么这样改：缺参是入口参数错误，不是网络失败；状态拆分后用户能获得正确处理路径，自动化也能区分错误态类型。
- 复测方式：`course-detail-missing-id-after-fix` 和 `course-detail-valid-id-after-fix` 均通过。
- 影响检查：课程详情真实 ID 路由 `/pages/course-detail/index?id=cmnn7b1wh000e103eoua6vc4j` 通过；完整 20 路由回归通过。

### WMP-2026-05-04-02 教练详情缺参状态不精确

- 复现方式：微信开发者工具自动化执行 `reLaunch('/pages/coach-detail/index')`。
- 修复文件：`src/pages/coach-detail/index.tsx`
- 修复方式：新增 `coachIdMissing` 状态；缺少 `id` 时展示“教练信息缺失”；真实加载失败且存在 `coachId` 时才允许重试加载。
- 为什么这样改：课程详情和教练详情属于同类详情入口，需要同类状态语义，避免同类问题反复漏掉。
- 复测方式：`coach-detail-missing-id-after-fix` 和 `coach-detail-valid-id-after-fix` 均通过。
- 影响检查：教练详情真实 ID 路由 `/pages/coach-detail/index?id=cmohramlw0016ckqllsxh3q36` 通过；完整 20 路由回归通过。

## 验证证据

- `npm run verify`：通过。
- `npm run test:api`：通过。
- 微信开发者工具 `auto`：通过，AppID `wx9608a7c1e99814f2`。
- 微信开发者工具模拟器巡检：20 个路由用例，0 failed，0 warning，0 exception，0 console。
- tab 切换：`tab-home`、`tab-courses`、`tab-profile` 全部通过。
- 微信开发者工具 `preview`：通过。
- 预览包大小：678,880 bytes（663.0 KB）。

证据文件：

- `docs/weapp-devtools-runtime-audit-2026-05-04.json`
- `docs/weapp-devtools-detail-fix-retest-2026-05-04.json`
- `docs/weapp-devtools-screenshots-2026-05-04/`
- `docs/weapp-devtools-screenshots-2026-05-04/preview-info.json`
- `docs/weapp-devtools-screenshots-2026-05-04/preview-qr.png`

## 仍未解决问题清单

| ID | 未解决项 | 当前卡点 | 当前状态 |
| --- | --- | --- | --- |
| DEVICE-2026-05-04-01 | 真机扫码后的实体微信客户端检查 | 当前自动化已生成 preview QR，但没有可由 Codex 直接控制的实体手机微信扫码、授权、网络环境和远程调试会话 | 未验证 |

## 漏查最严重的模块 / 流程

- 小程序 `dist` 包本身：之前更多验证停留在 H5 或源码层，缺少微信开发者工具实际打开 `dist` 后的证据。
- 详情页缺参入口：课程详情和教练详情属于同类页面，之前没有把“缺参空态”和“真实 ID 正常态”成对验证。
- 预览包链路：之前没有用微信开发者工具 CLI 生成 preview 包和二维码证据。

## 下一步最优先处理项

1. 用实体手机微信扫描 `docs/weapp-devtools-screenshots-2026-05-04/preview-qr.png`。
2. 在真机上复核登录授权、本地 API 可达性、HTTPS/合法域名策略、课程详情图片、预约按钮、支付弹窗。
3. 如果真机使用非开发者工具网络环境，必须把 `API_BASE_URL` 改为 HTTPS 合法域名后再验收。

## 当前是否达到可上线标准

- 达到：源码质量门禁、小程序 dist 构建、微信开发者工具模拟器、页面截图、预览包生成。
- 未达到：包含实体手机扫码和真实微信环境的最终上线签核，因为真机检查尚未执行。
