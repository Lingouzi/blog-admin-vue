import Vue from 'vue'

import 'normalize.css/normalize.css'

import ElementUI from 'element-ui' // element-ui
import 'element-ui/lib/theme-chalk/index.css'
import locale from 'element-ui/lib/locale/lang/zh-CN' // lang i18n

import 'font-awesome/css/font-awesome.css'

import '@/styles/index.scss' // global css

import App from './App'
import store from './store'
import router from './router'

import '@/icons' // 导入 全局的 icon
import '@/permission' // permission control
// 全局过滤器,主要是对用户输入的数据进行基本的校验,参考vue的filter, 或者对一些数据进行显示格式化,比如时间.
import * as filters from '@/filters' // global filters

// 注册过滤器
Object.keys(filters)
    .forEach(key => {
        Vue.filter(key, filters[key])
    })

// 设置 element 的国际化, 指定语言
Vue.use(ElementUI, { locale })
// 如果想要中文版 element-ui，按如下方式声明
// Vue.use(ElementUI)

Vue.config.productionTip = false

new Vue({
    el: '#app',
    router,
    store,
    render: h => h(App)
})
