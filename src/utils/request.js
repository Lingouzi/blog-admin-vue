import axios from 'axios'
import { Message, MessageBox } from 'element-ui'
import store from '@/store'
// import Qs from 'qs' // 用于同步请求的,暂时未支持
import { getToken } from '@/utils/auth'
// axios初始化
// const isPro = Object.is(process.env.NODE_ENV, 'production')
const service = axios.create({
    // baseURL: process.env.VUE_APP_BASE_API, // url = base url + request url
    // baseURL: isPro ? 'http://www.ybq87.top/vueapi/pc' : '/vueapi/pc',
    // withCredentials: true, // send cookies when cross-domain requests
    // 需要安装 npm install qs --save, 使用x-www-form-urlencoded传递参数.
    // config里面有这个transformRquest，这个选项会在发送参数前进行处理。
    // 这时候我们通过Qs.stringify转换为表单查询参数
    // transformRequest: [
    //     function(data) {
    //         // data = Qs.stringify(data)
    //         //
    //         data = Qs.stringify(
    //             data,
    //             //  加入JS对象转换配置
    //             { allowDots: true }
    //         )
    //         return data
    //     }
    // ],
    // headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 60000 // request timeout 超时时间.
})

// 拦截器, 在发送请求之前做一些处理, 比如加入token之类的
service.interceptors.request.use(
    config => {
        if (store.getters.token) {
            config.headers['Authorization'] = getToken()
        }
        return config
    },
    error => {
        return Promise.reject(error)
    }
)

// 设置全局的请求次数，重试的时间间隔
service.defaults.retry = 0
service.defaults.retryDelay = 1000

/**
 * 返回数据拦截器,
 */
service.interceptors.response.use(
    response => {
        const res = response.data
        // 这里依据自己系统设定的参数进行提示,
        if (res.code === 200) {
            return res
        } else {
            // 没有相关权限, 403
            // 401:暂未登录或token已经过期, 401
            if (res.code === 401) {
                MessageBox.confirm('登录认证异常, 请重新登录', '登 出', {
                    confirmButtonText: '重新登录',
                    cancelButtonText: '取消',
                    type: 'warning'
                }).then(() => {
                    store.dispatch('user/resetToken').then(() => {
                        location.reload()
                    })
                })
            } else {
                Message({
                    message: res.message,
                    type: 'error',
                    duration: 5 * 1000
                })
            }
            // 返回调用失败
            return Promise.reject(new Error(res.msg || 'Error'))
        }
    },
    err => {
        const errCode = err.response.status
        if (errCode === 400) {
            Message({
                message: '请求失败, 错误的请求参数',
                type: 'error',
                duration: 5 * 1000
            })
        }
        const config = err.config
        // If config does not exist or the retry option is not set, reject
        if (!config || !config.retry) {
            return Promise.reject(err)
        }
        // Set the variable for keeping track of the retry count
        config.__retryCount = config.__retryCount || 0

        // Check if we've maxed out the total number of retries
        if (config.__retryCount >= config.retry) {
            // Reject with the error
            Message({
                message: err.message,
                type: 'error',
                duration: 5 * 1000
            })
            return Promise.reject(err)
        }

        // Increase the retry count
        config.__retryCount += 1

        // Create new promise to handle exponential backoff
        const backoff = new Promise(function(resolve) {
            setTimeout(function() {
                resolve()
            }, config.retryDelay || 1)
        })

        // Return the promise in which recalls axios to retry the request
        return backoff.then(function() {
            // 如果是开发环境使用的代理cors,这里的config.url需要再做下处理,不然url不正确.
            return service(config)
        })
    }
)
export default service
