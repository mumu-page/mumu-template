const path = require('path')
const CracoLessPlugin = require('craco-less')
const lessModuleRegex = /\.module\.less$/;

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
    configure: (webpackConfig, {
      env, paths
    }) => {
      // webpackConfig.module.rules.push({
      //   test: /\.svg$/i,
      //   issuer: /\.[jt]sx?$/,
      //   use: ['@svgr/webpack'],
      // })
      return webpackConfig
    }
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
          // lessModuleRule.exclude = /node_modules|antd.*?\.css/;
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