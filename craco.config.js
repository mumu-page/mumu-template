// const { loaderByName } = require("@craco/craco");
const CracoLessPlugin = require('craco-less')
const path = require('path')
const lessModuleRegex = /\.module\.less$/;

module.exports = {
  webpack: {
    alias: {
      "@": path.resolve('src')
    },
    configureWebpack: config => {
      config.optimization = {
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: Infinity,
          minSize: 3000, // 依赖包超过300000bit将被单独打包
          automaticNameDelimiter:'-',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name(module) {
                const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
                return `chunk.${packageName.replace('@', '')}`;
              },
              priority:10
            }
          }
        }
      }
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
          // const cssLoader = lessModuleRule.use.find(loaderByName("css-loader"));
          // cssLoader.options.modules = {
          //   localIdentName: "[local]_[hash:base64:5]"
          // }
          return lessModuleRule;
        },
      },
    },
  ],
}