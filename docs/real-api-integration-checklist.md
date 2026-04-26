# 真实 API 联调清单

## 目标

用固定开发数据验证小程序已经能通过 mini-user token 调用后端真实接口。

## 环境准备

### 后端 `F:\pilates-studio-admin\backend`

1. 准备 `.env`，至少包含：

```env
NODE_ENV=development
PORT=3000
API_PREFIX=api
DATABASE_URL=mysql://root:password@127.0.0.1:3306/pilates_studio
JWT_ACCESS_SECRET=replace-with-strong-access-secret-min-32-chars
JWT_REFRESH_SECRET=replace-with-strong-refresh-secret-min-32-chars
SEED_MINI_OPEN_ID=dev-openid-pilates
```

2. 初始化数据库：

```bash
npm run prisma:generate
npm run prisma:migrate:dev
npm run seed
```

3. 启动后端：

```bash
npm run dev
```

### 小程序 `F:\pilates-studio-mini`

开发联调 `.env`：

```env
API_BASE_URL=http://127.0.0.1:3000/api
MINI_OPEN_ID=dev-openid-pilates
```

> 真机/生产必须使用真实微信 `code` 和 HTTPS 域名；`MINI_OPEN_ID` 只用于本地开发 fallback。

## 可执行 API smoke

后端启动后，在小程序目录执行：

```bash
npm run test:api
```

脚本会验证：

- mini-auth 登录拿 token
- 当前会员资料
- 当前会员卡
- 未来课程场次
- 我的预约
- 我的交易
- 会员方案

如需验证写接口：

```bash
API_SMOKE_MUTATIONS=1 npm run test:api
```

会额外提交一条反馈和一条续费申请。

## 微信开发者工具验证页面

1. 启动小程序后确认控制台无登录失败。
2. 首页：能展示会员权益和即将预约。
3. 预约页：能展示 seed 的未来课程场次。
4. 课程详情：能正常预约；重复预约应提示失败。
5. 我的预约：能看到 `BDEMO001`。
6. 会员中心：能看到 `小程序测试会员` 绑定的会员方案。
7. 续费会员：能提交续费申请。
8. 帮助与反馈：能提交反馈。
9. 交易记录：能看到续费申请生成的 `PENDING` 交易。

## 常见问题

- `401 Invalid or expired token`：清空小程序 storage 中的 `token` 后重进。
- `Mini user not found`：确认后端已执行 `npm run seed`，且小程序 `MINI_OPEN_ID` 与后端 `SEED_MINI_OPEN_ID` 一致。
- `API_BASE_URL 未配置`：确认小程序 `.env` 或构建环境中注入了 `API_BASE_URL`。
- 请求本地地址失败：微信开发者工具中开启“不校验合法域名”，真机必须配置 HTTPS 域名。
