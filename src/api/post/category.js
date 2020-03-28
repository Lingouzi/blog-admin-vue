import request from '@/utils/request'

/**
 * 分页
 * @param {*} data
 */
export function getList(data) {
    return request({
        url: '/category/list',
        method: 'get',
        params: data
    })
}

/**
 * 新建
 * @param {*} data
 */
export function create(data) {
    return request({
        url: '/category/create',
        method: 'post',
        data
    })
}

/**
 * 更新
 * @param {*} data
 */
export function update(data) {
    const { id } = data
    return request({
        url: '/category/update/' + id,
        method: 'post',
        data
    })
}

/**
 * 删除
 * @param {*} data
 */
export function deleteCategory(data) {
    return request({
        url: '/category/delete/',
        method: 'post',
        data
    })
}
