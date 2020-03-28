module.exports = {
    title: 'admin.ybq87.top',

    /**
     * 是否展示系统设置
     * @type {boolean} true | false
     * @description Whether show the settings right-panel
     */
    showSettings: true,

    /**
     * 是否展示 已打开的页面缓存
     * @type {boolean} true | false
     * @description Whether need tagsView
     */
    tagsView: true,

    /**
     * 是否固定顶部header
     * @type {boolean} true | false
     * @description Whether fix the header
     */
    fixedHeader: false,

    /**
     * 首页左侧栏, 顶部是否展示logo
     * @type {boolean} true | false
     * @description Whether show the logo in sidebar
     */
    sidebarLogo: true,
    /**
     * @type {string | array} 'production' | ['production', 'development']
     * @description Need show err logs component.
     * The default is only used in the production env
     * If you want to also use it in dev, you can pass ['production', 'development']
     */
    errorLog: 'production'
}
