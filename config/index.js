const packageInfo = require('../package.json');

const isProductionRelease = process.env.APP_ENV === 'production'
  || process.env.MINI_RELEASE === 'true'
  || (process.env.CI === 'true' && process.env.NODE_ENV === 'production');
const fallbackApiBaseUrl = 'http://127.0.0.1:3000/api';
const requiredProductionEnvKeys = ['API_BASE_URL', 'SUPPORT_PHONE', 'SUPPORT_EMAIL'];
const apiBaseUrl = process.env.API_BASE_URL || fallbackApiBaseUrl;
const localApiPattern = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?(\/|$)/;

if (isProductionRelease) {
  const missingKeys = requiredProductionEnvKeys.filter((key) => !process.env[key]);
  if (missingKeys.length > 0) {
    throw new Error(`生产发布缺少必要环境变量: ${missingKeys.join(', ')}`);
  }

  if (localApiPattern.test(apiBaseUrl)) {
    throw new Error('生产发布 API_BASE_URL 不能使用 localhost 或 127.0.0.1');
  }
}

const config = {
  projectName: 'pilates-studio-mini',
  date: '2024-4-3',
  designWidth: 750,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    828: 1.81 / 2
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  plugins: [],
  defineConstants: {
    API_BASE_URL: JSON.stringify(apiBaseUrl),
    MINI_OPEN_ID: JSON.stringify(process.env.MINI_OPEN_ID || ''),
    APP_VERSION: JSON.stringify(process.env.APP_VERSION || `v${packageInfo.version}`),
    SUPPORT_PHONE: JSON.stringify(process.env.SUPPORT_PHONE || ''),
    SUPPORT_EMAIL: JSON.stringify(process.env.SUPPORT_EMAIL || '')
  },
  copy: {
    patterns: [
      {
        from: 'src/assets/ui',
        to: 'dist/assets/ui',
      },
    ],
    options: {}
  },
  framework: 'react',
  compiler: 'webpack5',
  cache: {
    enable: false
  },
  mini: {
    postcss: {
      pxtransform: {
        enable: true,
        config: {}
      },
      url: {
        enable: true,
        config: {
          limit: 1024
        }
      },
      cssModules: {
        enable: false,
        config: {
          namingPattern: 'module',
          generateScopedName: '[name]__[local]___[hash:base64:5]'
        }
      }
    },
    // Production optimizations
    optimizeMainPackage: {
      enable: true
    }
  },
  h5: {
    publicPath: process.env.PUBLIC_PATH || '/',
    staticDirectory: 'static',
    esnextModules: ['taro-ui'],
    postcss: {
      autoprefixer: {
        enable: true,
        config: {}
      },
      cssModules: {
        enable: false,
        config: {
          namingPattern: 'module',
          generateScopedName: '[name]__[local]___[hash:base64:5]'
        }
      }
    },
    devServer: {
      port: process.env.DEV_PORT || 10086
    }
  }
};

module.exports = function (merge) {
  if (process.env.NODE_ENV === 'development') {
    return merge({}, config, require('./dev'));
  }
  return merge({}, config, require('./prod'));
};
