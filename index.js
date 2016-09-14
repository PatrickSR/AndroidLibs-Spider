/// <reference path="./typings/index.d.ts" />

var request = require('request')
var cheerio = require('cheerio')


var wilddogUrl = "https://android-libs.wilddogio.com/libs/"
var jsonSuffix = ".json"
    // var target = "https://github.com/XXApple/AndroidLibs/blob/master/%E5%88%97%E8%A1%A8List/README.md"

var masterKey = 'UZ4siGMJU177OqktfwSYxUJ9R3sJDSFVI475nCF9'

scan("https://github.com/XXApple/AndroidLibs/blob/master/%E5%88%97%E8%A1%A8List/README.md", "list")
scan("https://github.com/XXApple/AndroidLibs/blob/master/%E5%8A%A8%E7%94%BBAnimation/README.md", "animation")
scan("https://github.com/XXApple/AndroidLibs/blob/master/%E5%9B%BE%E6%A0%87Icon/README.md", "icon")
scan("https://github.com/XXApple/AndroidLibs/blob/master/%E5%9B%BE%E7%89%87%E6%A1%86%E6%9E%B6Image/README.md", "image")
scan("https://github.com/XXApple/AndroidLibs/tree/master/%E5%9B%BE%E8%A1%A8Chart/README.md", "chart")
scan("https://github.com/XXApple/AndroidLibs/tree/master/%E5%AE%8C%E6%95%B4%E5%BC%80%E6%BA%90%E9%A1%B9%E7%9B%AEProject/README.md", "project")
scan("https://github.com/XXApple/AndroidLibs/tree/master/%E5%B8%83%E5%B1%80Layout/README.md", "layout")
scan("https://github.com/XXApple/AndroidLibs/tree/master/%E5%BC%80%E5%8F%91%E6%A1%86%E6%9E%B6Framework/README.md", "framework")
scan("https://github.com/XXApple/AndroidLibs/tree/master/%E5%BC%B9%E6%A1%86Dialog/README.md", "dialog")
scan("https://github.com/XXApple/AndroidLibs/tree/master/%E6%8C%89%E9%92%AEButton/README.md", "button")
scan("https://github.com/XXApple/AndroidLibs/tree/master/%E6%96%87%E6%9C%ACLabel/README.md", "label")
scan("https://github.com/XXApple/AndroidLibs/tree/master/%E7%89%B9%E6%95%88Effect/README.md", "effect")
scan("https://github.com/XXApple/AndroidLibs/tree/master/%E7%BD%91%E7%BB%9C%E6%A1%86%E6%9E%B6Network/README.md", "network")
scan("https://github.com/XXApple/AndroidLibs/tree/master/%E8%87%AA%E5%AE%9A%E4%B9%89%E6%8E%A7%E4%BB%B6Custom/README.md", "custom")
scan("https://github.com/XXApple/AndroidLibs/tree/master/%E8%8F%9C%E5%8D%95Menu/README.md", "menu")
scan("https://github.com/XXApple/AndroidLibs/tree/master/%E8%BE%85%E5%8A%A9%E5%B7%A5%E5%85%B7%E7%B1%BBUtils/README.md", "utils")
scan("https://github.com/XXApple/AndroidLibs/blob/master/%E8%BF%9B%E5%BA%A6%E6%9D%A1Progressbar/README.md", "progressbar")


function scan(target, local) {
    request(target, function(err, response, body) {
        console.log("Request" + target + " Complate ... ")
        parse(body, local)
    })
}

function parse(body, local) {
    var list = []

    var $ = cheerio.load(body)

    $('hr').each(function(i, elememt) {
            var e = elememt.next.next
            if (!e) return;
            
            if(e.firstChild.firstChild){
                var itemName = e.firstChild.firstChild.data
            }else{
                return
            }
            
            var itemLink = e.lastChild.lastChild.data
            e = nextBlock(e)
            var itemRemark = e.firstChild.data
            e = nextBlock(e)

            var itemPic = []

            for (var index = 0; index < e.childNodes.length; index++) {
                var picNode = e.childNodes[index];
                if (picNode.attribs && picNode.attribs.href) {
                    itemPic.push(picNode.attribs.href)
                }
            }

            list.push({
                name: itemName,
                link: itemLink,
                remark: itemRemark,
                pic: itemPic
            })
       
    })

    putWilddog(list, local)
}

function nextBlock(elememt) {
    return elememt.next.next
}

/**
 * 保存到野狗
 */
function putWilddog(list, wilddogNode) {
    var options = {
        method: 'PUT',
        url: wilddogUrl + wilddogNode + jsonSuffix+"?auth="+masterKey,
        headers: {
            'content-type': 'application/json'
        },
        body: list,
        json: true
    };

    request(options, function(error, response, body) {
        if (error) throw new Error(error);

        console.log("put Wilddog +" + wilddogNode + " Complate");
    });

}