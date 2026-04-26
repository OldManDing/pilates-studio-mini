# Pilates Studio Mini Program

基于 **Taro 3 + React 18 + TypeScript + SCSS** 的普拉提工作室微信小程序前端项目。

本项目在保留现有业务/API 骨架的前提下，已按 `F:\figma` 里的设计源码完成主要页面的高保真对齐，并重建了小程序壳层、页面头部、卡片、按钮和自定义底部导航体系。

## 技术栈

- Taro 3.6
- React 18
- TypeScript
- SCSS
- 微信小程序运行时

## 当前页面状态

已完成主要页面的 Figma 对齐：

- 首页 `pages/index`
- 预约页 `pages/courses`
- 课程详情 `pages/course-detail`
- 教练列表/详情 `pages/coaches` / `pages/coach-detail`
- 会员中心 `pages/membership`
- 会员续费 `pages/membership-renew`
- 我的预约 `pages/my-bookings`
- 训练记录 `pages/training-records`
- 我的教练 `pages/my-coaches`
- 我的页 `pages/profile`
- 通知 `pages/notifications`
- 帮助 `pages/help`
- 设置 `pages/settings`
- 账户安全 `pages/account-security`
- 用户协议 `pages/agreement`
- 隐私政策 `pages/privacy`
- 交易记录 `pages/transactions`

## 目录结构

```text
src/
  api/                  接口封装与类型
  assets/               静态资源
  components/           公共组件
  components/shell/     页面壳层与导航相关组件
  constants/            全局常量（含导航常量）
  custom-tab-bar/       自定义底部导航
  pages/                各业务页面
  styles/               全局 token 与通用样式
```

## 本地开发

安装依赖：

```bash
npm install
```

启动微信小程序开发构建：

```bash
npm run dev:weapp
```

产物构建：

```bash
npm run build:weapp
```

## 验证命令

类型检查：

```bash
npm run typecheck
```

组合验证：

```bash
npm run verify
```

`verify` 当前会执行：

1. TypeScript 类型检查
2. 轻量 smoke 回归检查
3. 微信小程序构建

## 环境配置

请先准备 `.env` 文件：

```bash
cp .env.example .env
```

重点变量：

- `API_BASE_URL`
  - 开发环境可使用本地联调地址
  - 生产环境必须使用 HTTPS 域名
  - 不应使用 `localhost` / `127.0.0.1`

## 自定义导航说明

项目当前使用：

- `PageShell`
- `PageHeader`
- `custom-tab-bar`

其中底部 tabbar 配置已统一收敛到：

- `src/constants/navigation.ts`

## 发布

请参考：

- `RELEASE.md`

推荐发布前至少执行：

```bash
npm run verify
```

## 备注

- `project.private.config.json` 属于本地私有配置，不应提交到仓库
- 当前如果继续做视觉打磨，首页仍然是最值得优先精修的页面
