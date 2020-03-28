import request from '@/utils/request'
/** 通用方法工具类 */

/**
 * 上传文件
 * @param {Object} data
 */
export function uploadImg(data) {
    return request({
        url: '/oss/upload',
        method: 'post',
        data
    })
}
