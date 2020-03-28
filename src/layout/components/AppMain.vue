<template>
    <section class="app-main">
        <transition name="fade-transform" mode="out-in">
            <keep-alive :include="cachedRoutes">
                <router-view :key="key"/>
            </keep-alive>
        </transition>
    </section>
</template>

<script>
    export default {
        name: 'AppMain',
        computed: {
            cachedRoutes() {
                return this.$store.state.cache.cachedRoutes
            },
            key() {
                return this.$route.path
            }
        },
        watch: {
            $route() {
                /* 监控路由的变化，然后录入需要缓存的页面 */
                this.addRoute()
            }
        },
        mounted() {
            this.initRoute()
        },
        methods: {
            initRoute() {
                // 初始化，将 DashBoard 加入路由缓存
            },
            addRoute() {
                const { name } = this.$route
                if (name) {
                    this.$store.dispatch('cache/addRoute', this.$route)
                }
                return false
            }
        }
    }
</script>

<style scoped>
    .app-main {
        /*50 = navbar  */
        min-height: calc(100vh - 50px);
        width: 100%;
        position: relative;
        overflow: hidden;
    }

    .fixed-header + .app-main {
        padding-top: 50px;
    }
</style>

<style lang="scss">
    // fix css style bug in open el-dialog
    .el-popup-parent--hidden {
        .fixed-header {
            padding-right: 15px;
        }
    }
</style>
