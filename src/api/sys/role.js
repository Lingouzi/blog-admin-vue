import request from '@/utils/request'

/**
 * 加载用户信息分页
 * @param {*} data
 */
export function getList(data) {
    return request({
        url: '/role/list',
        method: 'get',
        params: data
    })
}

/**
 * 加载所有权限
 * @param {*} data
 */
export function getPermissionListByRoleId(data) {
    const { id } = data
    return request({
        url: '/role/permission/' + id,
        method: 'get'
    })
}

/**
 * 更新角色权限
 * @param data
 * @returns {AxiosPromise}
 */
export function updatePermission(data) {
    return request({
        url: '/role/permission/update',
        method: 'post',
        data
    })
}

/**
 * 新建权限
 * @param {*} data
 */
export function create(data) {
    return request({
        url: '/role/create',
        method: 'post',
        data
    })
}

/**
 * 更新权限内容
 * @param {*} data
 */
export function update(data) {
    const { id } = data
    return request({
        url: '/role/update/' + id,
        method: 'post',
        data
    })
}
