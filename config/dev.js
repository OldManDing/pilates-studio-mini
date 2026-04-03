module.exports = {
  logger: {
    quiet: false,
    stats: true,
  },
  mini: {
    // Mini program dev settings
    postcss: {
      pxtransform: {
        enable: true,
        config: {},
      },
    },
  },
  h5: {
    // H5 dev server settings
    devServer: {
      port: process.env.DEV_PORT || 10086,
      proxy: {
        '/api': {
          target: process.env.API_BASE_URL || 'http://localhost:3000',
          changeOrigin: true,
          pathRewrite: { '^/api': '/api' },
        },
      },
    },
  },
};
