/// <reference path="./typings/index.d.ts" />

var request = require('request')
var cheerio = require('cheerio')

var target = "https://github.com/XXApple/AndroidLibs/blob/master/%E5%88%97%E8%A1%A8List/README.md"

var list = []

request(target, function(err, response, body) {
    console.log("Request Complate ... ")

    // console.log(body)

    parse(body)

})


function parse(body) {
    var $ = cheerio.load(body)

    $('hr').each(function(i, elememt) {
        var e = elememt.next.next
        if(!e) return;
        var itemName = e.firstChild.firstChild.data
        var itemLink = e.lastChild.lastChild.data
        e = nextBlock(e)
        var itemRemark = e.firstChild.data
        e = nextBlock(e)

        var itemPic = []

        for (var index = 0; index < e.childNodes.length; index++) {
            var picNode = e.childNodes[index];
            if(picNode.attribs && picNode.attribs.href){
                itemPic.push(picNode.attribs.href)
            }
        }

        list.push({
            name:itemName,
            link:itemLink,
            remark:itemRemark,
            pic:itemPic
        })
    })

    console.log('result => '+JSON.stringify(list))
}

function nextBlock(elememt){
    return elememt.next.next
}