const getters = {
    cachedRoutes: state => state.cache.cachedRoutes, // 记录已经缓存的所有路由, 再次访问时,不会重新请求数据
    sidebar: state => state.app.sidebar,
    device: state => state.app.device,
    token: state => state.user.token, // 存储记录当前登录用户的token
    avatar: state => state.user.avatar,
    name: state => state.user.name,
    roles: state => state.user.roles,
    permission_routes: state => state.permission.routes,
    permissionData: state => state.permission.permissionData,
    categories: state => state.post.categories, // 博文的分类
    authors: state => state.post.authors // 作者列表,
}
export default getters
