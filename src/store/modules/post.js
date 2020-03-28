import { getCategorys, getAuthors } from '@/api/post/post'

const state = {
    categories: [],
    authors: []
}

const mutations = {
    SET_CATEGORIES: (state, categories) => {
        state.categories = categories
    },
    SET_AUTHORS: (state, authors) => {
        state.authors = authors
    }
}

const actions = {
    /**
     * 获取分类信息
     * @param commit
     * @param state
     * @returns {Promise<unknown>}
     */
    getCategorys({ commit, state }) {
        return new Promise((resolve, reject) => {
            if (state.categories.length === 0) {
                getCategorys()
                    .then(response => {
                        const { data } = response
                        commit('SET_CATEGORIES', data)
                        resolve(data)
                    })
                    .catch(error => {
                        reject(error)
                    })
            }
        })
    },
    getAuthors({ commit, state }) {
        return new Promise((resolve, reject) => {
            if (state.authors.length === 0) {
                getAuthors({ 'keyword': '' })
                    .then(response => {
                        const { data } = response
                        commit('SET_AUTHORS', data)
                        resolve(data)
                    })
                    .catch(error => {
                        reject(error)
                    })
            }
        })
    }
}

export default {
    namespaced: true,
    state,
    mutations,
    actions
}
