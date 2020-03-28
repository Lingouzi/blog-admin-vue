import Layout from '@/layout'

const adminRouter = {
    path: '/sys',
    component: Layout,
    alwaysShow: true,
    redirect: '/sys/umsAdmin',
    name: 'Sys',
    meta: {
        title: '系统管理',
        icon: 'list',
        roles: ['TEST']
    },
    children: [
        {
            path: 'umsAdmin',
            component: () => import('@/views/sys/user/index'),
            name: 'UmsAdmin',
            meta: { title: '后台用户管理', icon: 'peoples' }
        },
        {
            path: 'umsRole',
            component: () => import('@/views/sys/role/index'),
            name: 'UmsRole',
            meta: { title: '角色管理', icon: 'tree' }
        },
        {
            path: 'umsPermission',
            component: () => import('@/views/sys/permission/index'),
            name: 'UmsPermission',
            meta: { title: '权限管理', icon: 'tree-table' }
        }
    ]
}
export default adminRouter
