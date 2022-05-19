const path = require('path')
const CracoLessPlugin = require('craco-less')
const { BannerPlugin } = require('webpack')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const lessModuleRegex = /\.module\.less$/;
const HtmlWebpackExternalsPlugin = require('html-webpack-externals-plugin')

module.exports = {
  webpack: {
    alias: {
      "@": path.resolve('src')
    },
    optimization: {
      splitChunks: {
        cacheGroups: {
          commons: {
            chunks: 'initial',
            minChunks: 2,
            maxInitialRequests: 5,
            minSize: 0
          },
          vendor: {
            test: /node_modules/,
            chunks: 'initial',
            name: 'vendor',
            priority: 10,
            enforce: true
          }
        }
      }
    },
    plugins: [
      new HtmlWebpackExternalsPlugin({
        externals: [
          {
            module: 'react',
            entry:
              'https://unpkg.com/react@18/umd/react.production.min.js',
            global: 'React',
          },
          {
            module: 'react-dom',
            entry:
              'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
            global: 'ReactDOM',
          },
          {
            module: 'moment',
            entry: 'https://unpkg.com/moment@2/moment.js',
            global: 'moment',
          },
          {
            module: 'immer',
            entry:
              'https://unpkg.com/immer@9.0.1/dist/immer.umd.production.min.js',
            global: 'immer',
          },
          {
            module: 'lodash',
            entry:
              'https://unpkg.com/lodash@4/lodash.min.js',
            global: '_',
          },
          {
            module: 'antd',
            entry: 'https://unpkg.com/antd@4/dist/antd.min.js',
            global: 'antd',
          },
          {
            module: '@ant-design/icons',
            entry:
              'https://unpkg.com/@ant-design/icons@4/dist/index.umd.js',
            global: 'icons',
          },
          {
            module: 'data-view-react',
            entry: 'https://unpkg.com/@jiaminghi/data-view-react/umd/datav.min.js',
            global: 'datav',
          },
          {
            module: 'echarts',
            entry: 'https://unpkg.com/echarts@5.3.2/dist/echarts.min.js',
            global: 'echarts',
          },
          {
            module: 'react-grid-layout',
            entry: 'https://unpkg.com/react-grid-layout@1/dist/react-grid-layout.min.js',
            global: 'ReactGridLayout',
          },
        ]
      }),
      new BannerPlugin(`mumu-template v1.0.0
Copyright 2021-2022 the original author or authors.
Licensed under the Apache License, Version 2.0 (the 'License');`),
      new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        openAnalyzer: false, // 构建完打开浏览器
        reportFilename: path.resolve(__dirname, `build/analyzer.html`),
      }),
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
  babel: {
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
  devServer: {}
}