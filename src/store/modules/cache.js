const state = {
    cachedRoutes: ['Dashboard']
}

const mutations = {
    ADD_CACHED_ROUTE: (state, view) => {
        if (state.cachedRoutes.includes(view.name)) return
        // 默认 缓存所有页面， 除非有特别注释不缓存的
        if (!view.meta.noCache) {
            state.cachedRoutes.push(view.name)
        }
    }
}

const actions = {
    addRoute({ commit, state }, view) {
        commit('ADD_CACHED_ROUTE', view)
    }
}

export default {
    namespaced: true,
    state,
    mutations,
    actions
}
