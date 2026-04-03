# Pilates Studio Mini Program - Build & Release Guide

## Prerequisites

- Node.js 18+
- WeChat Developer Tools (微信开发者工具)
- Valid WeChat Mini Program AppID
- Backend API deployed and accessible via HTTPS

## Environment Setup

```bash
cd /path/to/pilates-studio-mini

# Copy environment template
cp .env.example .env

# Edit .env with production values:
# API_BASE_URL=https://api.yourdomain.com/api
# WECHAT_APPID=your-wechat-appid
```

## Build Steps

### WeChat Mini Program (默认)

```bash
# Install dependencies
npm install

# Production build
npm run build:weapp

# Output directory: dist/
```

### H5 (可选)

```bash
npm run build:h5
# Output directory: dist/
```

## Release Process

### 1. Pre-Release Checklist

- [ ] `.env` 中 `API_BASE_URL` 已指向生产环境
- [ ] 后端域名已在微信公众平台「request 合法域名」中配置
- [ ] `project.config.json` 中 `appid` 已更新为正式 AppID
- [ ] 所有页面测试通过
- [ ] 无 console.log 残留（建议使用 Terser 自动清理）

### 2. Build

```bash
npm run build:weapp
```

### 3. Upload to WeChat

1. 打开 **微信开发者工具**
2. 导入项目，选择 `pilates-studio-mini/dist` 目录
3. 点击右上角 **上传** 按钮
4. 填写版本号（建议与 `package.json` 保持一致，如 `1.0.0`）
5. 填写项目备注，完成上传

### 4. WeChat Admin Console

1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 进入「版本管理」
3. 在「开发版本」中找到刚上传的版本
4. 点击「提交审核」
5. 审核通过后，点击「发布」

## Domain Configuration

在微信公众平台 **开发 → 开发管理 → 开发设置 → 服务器域名** 中配置：

- **request合法域名**: `https://api.yourdomain.com`
- **uploadFile合法域名**: （如需要文件上传）
- **downloadFile合法域名**: （如需要图片下载）

注意：
- 域名必须备案
- 不支持 IP 地址和端口（生产环境）
- 不支持 `localhost`

## Troubleshooting

### Build Errors

```bash
# 清理缓存重新构建
rm -rf dist node_modules package-lock.json
npm install
npm run build:weapp
```

### API Connection Failed

- 检查域名是否已在微信后台白名单
- 确保后端 API 使用 HTTPS
- 检查 TLS 版本（微信要求 TLS 1.2+）
- 在开发者工具中关闭「不校验合法域名」测试真实环境

### Bundle Size Too Large

- 主包体积不要超过 2MB
- 使用分包加载（subpackages）拆分非核心页面
- 压缩图片资源
- 按需引入组件

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-04-03 | Initial release |
