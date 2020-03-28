import defaultSettings from '@/settings'
/** 设置页面的标题 */
const title = defaultSettings.title

export default function getPageTitle(pageTitle) {
    if (pageTitle) {
        return `${pageTitle} - ${title}`
    }
    return `${title}`
}
