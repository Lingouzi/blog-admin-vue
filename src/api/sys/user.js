import request from '@/utils/request'

/**
 * 加载用户信息分页
 * @param {*} data
 */
export function getList(data) {
    return request({
        url: '/admin/list',
        method: 'get',
        params: data
    })
}

/**
 * 更新用户状态,
 * @param {*} data
 */
export function updateStatus(data) {
    return request({
        url: '/admin/update/status',
        method: 'post',
        data
    })
}
/**
 * 更改用户图像
 * @param {*} data
 */
export function updateIcon(data) {
    return request({
        url: '/admin/update/icon',
        method: 'post',
        data
    })
}
/**
 * 更改密码
 * @param {*} data
 */
export function updatePassowrd(data) {
    return request({
        url: '/admin/update/password',
        method: 'post',
        data
    })
}
/**
 * 创建新用户
 * @param {*} data
 */
export function saveUser(data) {
    return request({
        url: '/admin/register',
        method: 'post',
        data
    })
}

/**
 * 用户登录
 * @param {*} data
 */
export function login(data) {
    return request({
        url: '/admin/login',
        method: 'post',
        data
    })
}

/**
 * 通过token 获取到用户信息
 * @param {*} token
 */
export function getInfo(token) {
    return request({
        url: '/admin/info',
        method: 'get',
        params: { token }
    })
}

/**
 * 注销登录
 */
export function logout() {
    return request({
        url: '/admin/logout',
        method: 'post'
    })
}
