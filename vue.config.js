/** 严格模式 */
'use strict'
/** vue配置文件 */
const path = require('path')
/** 加载默认设置 */

const defaultSettings = require('./src/settings.js')

/** 组合path,返回绝对路径. */
function resolve(dir) {
    return path.join(__dirname, dir)
}

// 生成页面之后,顶部title的名称,随便写
const name = defaultSettings.title || '后台管理系统' // page title
// 项目端口, 本地测试环境的端口, 如果这里端口设置为80,那么你需要使用sudo npm run serve,才能启动测试服务,因为默认MAC 的80端口不对外开放
const port = 8082 // dev port

module.exports = {
    // 部署应用包时的基本 URL,默认情况下，Vue CLI 会假设你的应用是被部署在一个域名的根路径上，例如 https://www.my-app.com/。
    // 如果应用被部署在一个子路径上，你就需要用这个选项指定这个子路径。例如，如果你的应用被部署在 https://www.my-app.com/my-app/，则设置 publicPath 为 /my-app/。
    publicPath: '/admin',
    outputDir: 'admin', // 当运行 vue-cli-service build 时生成的生产环境构建文件的目录
    assetsDir: 'static', // 默认为空,放置生成的静态资源 (js、css、img、fonts) 的 (相对于 outputDir 的) 目录。
    indexPath: 'index.html', // 指定生成的 index.html 的输出路径 (相对于 outputDir)。也可以是一个绝对路径。使用build构建项目,首页的存放地点
    filenameHashing: true, // 生成的静态资源在它们的文件名中包含了 hash 以便更好的控制缓存
    lintOnSave: process.env.NODE_ENV === 'development', // 在开发时,是否每次保存时,使用eslint检查代码.[如果直接设置为true,则开发,生产模式都会启用的]
    productionSourceMap: false, // 不需要生产环境的 source map，可以将其设置为 false 以加速生产环境构建
    devServer: {
        // 支持所有的webpack的devServer参数
        port: port, // 端口号
        open: true, // 启动项目后,打开默认浏览器
        overlay: {
            // 报错时,在浏览器弹出一个遮罩,展示错误.
            warnings: false,
            errors: true
        },
        // 如果你的前端应用和后端 API 服务器没有运行在同一个主机上，你需要在开发环境下将 API 请求代理到 API 服务器。
        // 这个问题可以通过 vue.config.js 中的 devServer.proxy 选项来配置。
        proxy: {
            '/': {
                // 将所有的api接口转发到 http://localhost:8080
                // 或者指定URI: 例如 :/vue 表示将 /vue开头的uri请求都转发到 target
                target: 'http://localhost:8080/',
                changeOrigin: true
            }
        }
    },
    configureWebpack: {
        name: name, //
        resolve: {
            alias: {
                // 别名设置, 比如原来访问:import Utility from './components/HelloWorld';现在可以简写为:import Utility from '@/components/HelloWorld'
                '@': resolve('src') // 指代src根目录
            }
        }
    },
    // 报表 参考 https://github.com/ecomfe/vue-echarts/blob/master/README.zh_CN.md
    transpileDependencies: [
        'vue-echarts',
        'resize-detector'
    ],
    /** 更加细颗粒度的配置webpack, 此处参考 vue-element-admin  */
    chainWebpack(config) {
        config.plugins.delete('preload') // TODO: need test
        config.plugins.delete('prefetch') // TODO: need test

        // set svg-sprite-loader
        config.module
            .rule('svg')
            .exclude
            .add(resolve('src/icons'))
            .end()
        config.module
            .rule('icons')
            .test(/\.svg$/)
            .include
            .add(resolve('src/icons'))
            .end()
            .use('svg-sprite-loader')
            .loader('svg-sprite-loader')
            .options({
                symbolId: 'icon-[name]'
            })
            .end()

        // set preserveWhitespace
        config.module
            .rule('vue')
            .use('vue-loader')
            .loader('vue-loader')
            .tap(options => {
                options.compilerOptions.preserveWhitespace = true
                return options
            })
            .end()

        config
            // https://webpack.js.org/configuration/devtool/#development
            .when(process.env.NODE_ENV === 'development', config => config.devtool('cheap-source-map'))

        config.when(process.env.NODE_ENV !== 'development', config => {
            config
                .plugin('ScriptExtHtmlWebpackPlugin') // 插件作用: js 加载方式支持 Async 或 defer
                .after('html')
                .use('script-ext-html-webpack-plugin', [
                    {
                        // `runtime` must same as runtimeChunk name. default is `runtime`
                        inline: /runtime\..*\.js$/
                    }
                ])
                .end()
            config.optimization.splitChunks({
                chunks: 'all',
                cacheGroups: {
                    libs: {
                        name: 'chunk-libs',
                        test: /[\\/]node_modules[\\/]/,
                        priority: 10,
                        chunks: 'initial' // only package third parties that are initially dependent
                    },
                    elementUI: {
                        name: 'chunk-elementUI', // split elementUI into a single package
                        priority: 20, // the weight needs to be larger than libs and app or it will be packaged into libs or app
                        test: /[\\/]node_modules[\\/]_?element-ui(.*)/ // in order to adapt to cnpm
                    },
                    commons: {
                        name: 'chunk-commons',
                        test: resolve('src/components'), // can customize your rules
                        minChunks: 3, //  minimum common number
                        priority: 5,
                        reuseExistingChunk: true
                    }
                }
            })
            config.optimization.runtimeChunk('single')
        })
    }
}
