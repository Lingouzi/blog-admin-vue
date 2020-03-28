/**
 * Created with JetBrains PhpStorm.
 * User: xuheng
 * Date: 12-8-8
 * Time: 下午2:09
 * To change this template use File | Settings | File Templates.
 */
(function () {
    const me = editor
    const preview = $G('preview')
    const preitem = $G('preitem')
    const tmps = templates
    let currentTmp
    const initPre = function () {
        let str = ''
        for (var i = 0, tmp; tmp = tmps[i++];) {
            str += '<div class="preitem" onclick="pre(' + i + ')"><img src="' + 'images/' + tmp.pre + '" ' + (tmp.title ? 'alt=' + tmp.title + ' title=' + tmp.title + '' : '') + '></div>'
        }
        preitem.innerHTML = str
    }
    const pre = function (n) {
        const tmp = tmps[n - 1]
        currentTmp = tmp
        clearItem()
        domUtils.setStyles(preitem.childNodes[n - 1], {
            'background-color': 'lemonChiffon',
            'border': '#ccc 1px solid'
        })
        preview.innerHTML = tmp.preHtml ? tmp.preHtml : ''
    }
    var clearItem = function () {
        const items = preitem.children
        for (var i = 0, item; item = items[i++];) {
            domUtils.setStyles(item, {
                'background-color': '',
                'border': 'white 1px solid'
            })
        }
    }
    dialog.onok = function () {
        if (!$G('issave').checked) {
            me.execCommand('cleardoc')
        }
        const obj = {
            html: currentTmp && currentTmp.html
        }
        me.execCommand('template', obj)
    }
    initPre()
    window.pre = pre
    pre(2)
})()
