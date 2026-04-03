module.exports = {
  mini: {
    // Mini program production optimizations
    postcss: {
      pxtransform: {
        enable: true,
        config: {},
      },
      url: {
        enable: true,
        config: {
          limit: 1024,
        },
      },
      cssModules: {
        enable: false,
      },
    },
    // Optimize bundle size
    optimizeMainPackage: {
      enable: true,
    },
  },
  h5: {
    publicPath: process.env.PUBLIC_PATH || '/',
    staticDirectory: 'static',
    esnextModules: ['taro-ui'],
    miniCssExtractPluginOption: {
      ignoreOrder: true,
    },
    // Enable source map for production debugging (optional)
    sourceMap: false,
    // Code splitting
    router: {
      mode: 'browser',
    },
    // Optimization
    optimization: {
      splitChunks: {
        cacheGroups: {
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      },
    },
  },
  // Logger configuration
  logger: {
    quiet: true,
    stats: true,
  },
};
