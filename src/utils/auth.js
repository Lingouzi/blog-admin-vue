import Cookies from 'js-cookie'

/** 存储token到浏览器cookie,管理token */
const TokenKey = 'blog_token'

export function getToken() {
    return Cookies.get(TokenKey)
}

export function setToken(token) {
    return Cookies.set(TokenKey, token)
}

export function removeToken() {
    return Cookies.remove(TokenKey)
}
