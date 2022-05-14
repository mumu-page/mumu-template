const path = require('path')
const CracoLessPlugin = require('craco-less')
const {BannerPlugin} = require('webpack')
const lessModuleRegex = /\.module\.less$/;
const HtmlWebpackExternalsPlugin = require('html-webpack-externals-plugin')

module.exports = {
  webpack: {
    alias: {
      "@": path.resolve('src')
    },
    configure: (webpackConfig, {env: webpackEnv, paths}) => {
      if (webpackEnv === 'production') {
        webpackConfig.plugins.push(new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false, // 构建完打开浏览器
          reportFilename: path.resolve(__dirname, `build/analyzer.html`),
        }))
        webpackConfig.optimization.splitChunks = {
          ...webpackConfig.optimization.splitChunks,
          cacheGroups: {
            commons: {
              chunks: 'all',
              // 将两个以上的chunk所共享的模块打包至commons组。
              minChunks: 2,
              name: 'commons',
              priority: 80,
            },
            base: {
              // 基本框架
              chunks: 'all',
              test: /(react|react-dom|react-dom-router)/,
              name: 'base',
              priority: 100,
            },
            antd: {
              name: 'antd',
              chunks: 'all',
              test: /(antd|moment|immutable\/dist|braft-finder\/dist|lodash|rc-(.*)\/es)[\\/]/,
              priority: 100,
            },
            immer: {
              name: 'immer',
              chunks: 'all',
              test: /(immer)/,
              priority: 100,
            },
          },
        };
      }
      return webpackConfig;
    },
    plugins: [
      new HtmlWebpackExternalsPlugin({
        externals: [
          {
            module: 'react',
            entry:
              'https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js',
            global: 'React',
          },
          {
            module: 'react-dom',
            entry:
              'https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js',
            global: 'ReactDOM',
          },
          {
            module: 'moment',
            entry: 'https://cdn.jsdelivr.net/npm/moment@2/moment.min.js',
            global: 'moment',
          },
          {
            module: 'immer',
            entry:
              'https://cdn.jsdelivr.net/npm/immer@9.0.1/dist/immer.umd.production.min.js',
            global: 'immer',
          },
          {
            module: 'antd',
            entry: 'https://cdn.jsdelivr.net/npm/antd@4/dist/antd.min.js',
            global: 'antd',
          },
          {
            module: '@ant-design/icons',
            entry:
              'https://cdn.jsdelivr.net/npm/@ant-design/icons@4/dist/index.umd.js',
            global: 'icons',
          },
        ]
      }),
      new BannerPlugin(`
mumu-template v1.0.0
Copyright 2021-2022 the original author or authors.
Licensed under the Apache License, Version 2.0 (the 'License');
      `)
    ]
  },
  plugins: [
    {
      plugin: CracoLessPlugin,
      options: {
        lessLoaderOptions: {
          lessOptions: {
            // modifyVars: { '@primary-color': '#1DA57A' },
            javascriptEnabled: true,
          },
        },
        modifyLessModuleRule: (lessModuleRule, context) => {
          lessModuleRule.test = lessModuleRegex;
          lessModuleRule.exclude = /node_modules|antd.*?\.css/;
          return lessModuleRule;
        },
      },
    },
  ],
  babel: {//支持装饰器
    plugins: [
      [
        "import",
        {
          "libraryName": "antd",
          "libraryDirectory": "es",
          "style": 'css' //设置为true即是less 这里用的是css
        }
      ]
    ]
  },
}