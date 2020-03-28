import request from '@/utils/request'

/**
 * 分页
 * @param {*} data
 */
export function getList(data) {
    return request({
        url: '/post/list',
        method: 'get',
        params: data
    })
}

/**
 * 依据id 获取post，主要是内容
 * @param {*} data
 */
export function getPostById(data) {
    const { id } = data
    return request({
        url: '/post/' + id,
        method: 'get'
    })
}

/**
 * 搜索作者
 * @param {*} data
 */
export function getAuthors(data) {
    return request({
        url: '/post/authors',
        method: 'get',
        params: data
    })
}

/**
 * 搜索分类
 * @param {*} data
 */
export function getCategorys() {
    return request({
        url: '/post/categories',
        method: 'get'
    })
}

/**
 * 新建
 * @param {*} data
 */
export function create(data) {
    return request({
        url: '/post/create',
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
        url: '/post/update/' + id,
        method: 'post',
        data
    })
}

/**
 * 更新 作者
 * @param {*} data
 */
export function updateAuthor(data) {
    return request({
        url: '/post/update/author',
        method: 'post',
        data
    })
}

/**
 * 更新 分类
 * @param {*} data
 */
export function updateCategory(data) {
    return request({
        url: '/post/update/category',
        method: 'post',
        data
    })
}

/**
 * 删除
 * @param {*} data
 */
export function deletePost(data) {
    return request({
        url: '/post/delete',
        method: 'post',
        data
    })
}
