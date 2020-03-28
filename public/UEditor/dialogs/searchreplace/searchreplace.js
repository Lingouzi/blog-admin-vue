/**
 * Created with JetBrains PhpStorm.
 * User: xuheng
 * Date: 12-9-26
 * Time: 下午12:29
 * To change this template use File | Settings | File Templates.
 */

// 清空上次查选的痕迹
editor.firstForSR = 0
editor.currentRangeForSR = null
// 给tab注册切换事件
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
$G('searchtab').onmousedown = function() {
    $G('search-msg').innerHTML = ''
    $G('replace-msg').innerHTML = ''
}
// 是否区分大小写
function getMatchCase(id) {
    return !!$G(id).checked
}
// 查找
$G('nextFindBtn').onclick = function (txt, dir, mcase) {
    const findtxt = $G('findtxt').value; let obj
    if (!findtxt) {
        return false
    }
    obj = {
        searchStr: findtxt,
        dir: 1,
        casesensitive: getMatchCase('matchCase')
    }
    if (!frCommond(obj)) {
        const bk = editor.selection.getRange().createBookmark()
        $G('search-msg').innerHTML = lang.getEnd
        editor.selection.getRange().moveToBookmark(bk)
            .select()
    }
}
$G('nextReplaceBtn').onclick = function (txt, dir, mcase) {
    const findtxt = $G('findtxt1').value; let obj
    if (!findtxt) {
        return false
    }
    obj = {
        searchStr: findtxt,
        dir: 1,
        casesensitive: getMatchCase('matchCase1')
    }
    frCommond(obj)
}
$G('preFindBtn').onclick = function (txt, dir, mcase) {
    const findtxt = $G('findtxt').value; let obj
    if (!findtxt) {
        return false
    }
    obj = {
        searchStr: findtxt,
        dir: -1,
        casesensitive: getMatchCase('matchCase')
    }
    if (!frCommond(obj)) {
        $G('search-msg').innerHTML = lang.getStart
    }
}
$G('preReplaceBtn').onclick = function (txt, dir, mcase) {
    const findtxt = $G('findtxt1').value; let obj
    if (!findtxt) {
        return false
    }
    obj = {
        searchStr: findtxt,
        dir: -1,
        casesensitive: getMatchCase('matchCase1')
    }
    frCommond(obj)
}
// 替换
$G('repalceBtn').onclick = function () {
    const findtxt = $G('findtxt1').value.replace(/^\s|\s$/g, ''); let obj
    const replacetxt = $G('replacetxt').value.replace(/^\s|\s$/g, '')
    if (!findtxt) {
        return false
    }
    if (findtxt == replacetxt || (!getMatchCase('matchCase1') && findtxt.toLowerCase() == replacetxt.toLowerCase())) {
        return false
    }
    obj = {
        searchStr: findtxt,
        dir: 1,
        casesensitive: getMatchCase('matchCase1'),
        replaceStr: replacetxt
    }
    frCommond(obj)
}
// 全部替换
$G('repalceAllBtn').onclick = function () {
    const findtxt = $G('findtxt1').value.replace(/^\s|\s$/g, ''); let obj
    const replacetxt = $G('replacetxt').value.replace(/^\s|\s$/g, '')
    if (!findtxt) {
        return false
    }
    if (findtxt == replacetxt || (!getMatchCase('matchCase1') && findtxt.toLowerCase() == replacetxt.toLowerCase())) {
        return false
    }
    obj = {
        searchStr: findtxt,
        casesensitive: getMatchCase('matchCase1'),
        replaceStr: replacetxt,
        all: true
    }
    const num = frCommond(obj)
    if (num) {
        $G('replace-msg').innerHTML = lang.countMsg.replace('{#count}', num)
    }
}
// 执行
var frCommond = function (obj) {
    return editor.execCommand('searchreplace', obj)
}
switchTab('searchtab')
