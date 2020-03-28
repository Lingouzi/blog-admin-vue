/**
 * Created with JetBrains PhpStorm.
 * User: xuheng
 * Date: 12-9-26
 * Time: 下午1:06
 * To change this template use File | Settings | File Templates.
 */
/**
 * tab点击处理事件
 * @param tabHeads
 * @param tabBodys
 * @param obj
 */
function clickHandler(tabHeads, tabBodys, obj) {
    // head样式更改
    for (let k = 0, len = tabHeads.length; k < len; k++) {
        tabHeads[k].className = ''
    }
    obj.className = 'focus'
    // body显隐
    const tabSrc = obj.getAttribute('tabSrc')
    for (let j = 0, length = tabBodys.length; j < length; j++) {
        const body = tabBodys[j]
        const id = body.getAttribute('id')
        body.onclick = function() {
            this.style.zoom = 1
        }
        if (id != tabSrc) {
            body.style.zIndex = 1
        } else {
            body.style.zIndex = 200
        }
    }
}

/**
 * TAB切换
 * @param tabParentId  tab的父节点ID或者对象本身
 */
function switchTab(tabParentId) {
    const tabElements = $G(tabParentId).children
    const tabHeads = tabElements[0].children
    const tabBodys = tabElements[1].children

    for (let i = 0, length = tabHeads.length; i < length; i++) {
        const head = tabHeads[i]
        if (head.className === 'focus')clickHandler(tabHeads, tabBodys, head)
        head.onclick = function () {
            clickHandler(tabHeads, tabBodys, this)
        }
    }
}
switchTab('helptab')

document.getElementById('version').innerHTML = parent.UE.version
