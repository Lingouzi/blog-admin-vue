import Layout from '@/layout'

const postRouter = {
    path: '/post',
    component: Layout,
    alwaysShow: true,
    redirect: '/post/list',
    name: 'Post',
    meta: {
        title: '博文管理',
        icon: 'documentation',
        roles: ['TEST']
    },
    children: [
        {
            path: 'ueditor/:id',
            component: () => import('@/views/post/post/Ueditor'),
            name: 'Ueditor',
            meta: { title: 'Ueditor编辑', noCache: true },
            hidden: true
        },
        {
            path: 'markdown/:id',
            component: () => import('@/views/post/post/markdown'),
            name: 'MarkDown',
            meta: { title: 'MarkDown编辑', noCache: true },
            hidden: true
        },
        {
            path: 'list',
            component: () => import('@/views/post/post/index'),
            name: 'PostList',
            meta: { title: '博文管理', icon: 'list' }
        },
        {
            path: 'author',
            component: () => import('@/views/post/author/index'),
            name: 'CmsAuthor',
            meta: { title: '博文作者', icon: 'people' }
        },
        {
            path: 'postCategory',
            component: () => import('@/views/post/category/index'),
            name: 'PostCategory',
            meta: { title: '博文分类管理', icon: 'nested' }
        }
    ]
}
export default postRouter
