import request from '@/utils/request'

/**
 * 加载用户信息分页
 * @param {*} data
 */
export function getList(data) {
    return request({
        url: '/permission/list',
        method: 'get',
        params: data
    })
}

/**
 * 加载所有权限
 * @param {*} data
 */
export function getPermissionList() {
    return request({
        url: '/permission/treeList',
        method: 'get'
    })
}

/**
 * 新建权限
 * @param {*} data
 */
export function create(data) {
    return request({
        url: '/permission/create',
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
        url: '/permission/update/' + id,
        method: 'post',
        data
    })
}
