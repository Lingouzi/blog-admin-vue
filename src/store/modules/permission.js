import { asyncRoutes, constantRoutes } from '@/router'
import { getPermissionList } from '@/api/sys/permission'

/**
 * 判断是否有权限, 在路由中 ,meta.role字段标志需要哪些角色权限才能访问.
 * Use meta.role to determine if the current user has permission
 * @param roles
 * @param route
 */
function hasPermission(roles, route) {
    if (route.meta && route.meta.roles) {
        return roles.some(role => route.meta.roles.includes(role))
    } else {
        return true
    }
}

/**
 * Filter asynchronous routing tables by recursion
 * @param routes asyncRoutes
 * @param roles
 */
export function filterAsyncRoutes(routes, roles) {
    const res = []

    routes.forEach(route => {
        const tmp = { ...route }
        if (hasPermission(roles, tmp)) {
            if (tmp.children) {
                tmp.children = filterAsyncRoutes(tmp.children, roles)
            }
            res.push(tmp)
        }
    })

    return res
}

// 对外开放的数据
const state = {
    routes: [],
    addRoutes: [],
    permissionData: []
}

const mutations = {
    SET_ROUTES: (state, routes) => {
        state.addRoutes = routes
        state.routes = constantRoutes.concat(routes)
        console.log(state.routes)
    },
    SET_PERMISSION: (state, datas) => {
        state.permissionData = datas
    }
}

const actions = {
    /** 生成 routes */
    generateRoutes({ commit }, roles) {
        return new Promise(resolve => {
            let accessedRoutes
            if (roles.includes('admin')) {
                accessedRoutes = asyncRoutes || []
            } else {
                accessedRoutes = filterAsyncRoutes(asyncRoutes, roles)
            }
            commit('SET_ROUTES', accessedRoutes)
            resolve(accessedRoutes)
        })
    },
    // 获取全部权限
    getPermissionList({ commit, state }) {
        return new Promise((resolve, reject) => {
            getPermissionList()
                .then(response => {
                    const { data } = response
                    commit('SET_PERMISSION', data)
                    resolve(data)
                })
                .catch(error => {
                    reject(error)
                })
        })
    }
}

export default {
    namespaced: true,
    state,
    mutations,
    actions
}
