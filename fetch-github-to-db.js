/**
 * 定时去从Android-Libs的github里面把新的内容同步到DB里面
 * 
 * 循环暂定一天一次，每天早上8点开始
 * 
 */
const schedule = require('node-schedule')

const request = require('request')
const cheerio = require('cheerio')

/**
 * 拉取数据的url
 */
const targets = [
    {
        link: "https://github.com/XXApple/AndroidLibs/blob/master/%E5%88%97%E8%A1%A8List/README.md",
        category: "list"
    },
    {
        link: "https://github.com/XXApple/AndroidLibs/blob/master/%E5%8A%A8%E7%94%BBAnimation/README.md",
        category: "animation"
    },
    {
        link: "https://github.com/XXApple/AndroidLibs/blob/master/%E5%9B%BE%E6%A0%87Icon/README.md",
        category: "icon"
    },
    {
        link: "https://github.com/XXApple/AndroidLibs/blob/master/%E5%9B%BE%E7%89%87%E6%A1%86%E6%9E%B6Image/README.md",
        category: "image"
    },
    {
        link: "https://github.com/XXApple/AndroidLibs/tree/master/%E5%9B%BE%E8%A1%A8Chart/README.md",
        category: "chart"
    },
    {
        link: "https://github.com/XXApple/AndroidLibs/tree/master/%E5%AE%8C%E6%95%B4%E5%BC%80%E6%BA%90%E9%A1%B9%E7%9B%AEProject/README.md",
        category: "project"
    },
    {
        link: "https://github.com/XXApple/AndroidLibs/tree/master/%E5%B8%83%E5%B1%80Layout/README.md",
        category: "layout"
    },
    {
        link: "https://github.com/XXApple/AndroidLibs/tree/master/%E5%BC%80%E5%8F%91%E6%A1%86%E6%9E%B6Framework/README.md",
        category: "framework"
    },
    {
        link: "https://github.com/XXApple/AndroidLibs/tree/master/%E5%BC%B9%E6%A1%86Dialog/README.md",
        category: "dialog"
    },
    {
        link: "https://github.com/XXApple/AndroidLibs/tree/master/%E6%8C%89%E9%92%AEButton/README.md",
        category: "button"
    },
    {
        link: "https://github.com/XXApple/AndroidLibs/tree/master/%E6%96%87%E6%9C%ACLabel/README.md",
        category: "label"
    },
    {
        link: "https://github.com/XXApple/AndroidLibs/tree/master/%E7%89%B9%E6%95%88Effect/README.md",
        category: "effect"
    },
    {
        link: "https://github.com/XXApple/AndroidLibs/tree/master/%E7%BD%91%E7%BB%9C%E6%A1%86%E6%9E%B6Network/README.md",
        category: "network"
    },
    {
        link: "https://github.com/XXApple/AndroidLibs/tree/master/%E8%87%AA%E5%AE%9A%E4%B9%89%E6%8E%A7%E4%BB%B6Custom/README.md",
        category: "custom"
    },
    {
        link: "https://github.com/XXApple/AndroidLibs/tree/master/%E8%8F%9C%E5%8D%95Menu/README.md",
        category: "menu"
    },
    {
        link: "https://github.com/XXApple/AndroidLibs/tree/master/%E8%BE%85%E5%8A%A9%E5%B7%A5%E5%85%B7%E7%B1%BBUtils/README.md",
        category: "utils"
    },
    {
        link: "https://github.com/XXApple/AndroidLibs/blob/master/%E8%BF%9B%E5%BA%A6%E6%9D%A1Progressbar/README.md",
        category: "progressbar"
    },
    {
        link: "https://github.com/XXApple/AndroidLibs/blob/master/RxJava/README.md",
        category: "rxjava"
    },
    {
        link:"https://github.com/XXApple/AndroidLibs/blob/master/%E9%9F%B3%E8%A7%86%E9%A2%91Audio_Video/README.md",
        category:"audio_video"
    },
    {
        link:"https://github.com/XXApple/AndroidLibs/blob/master/AI_VI/README.md",
        category:"ai_vi"
    },
    {
        link:"https://github.com/XXApple/AndroidLibs/blob/master/gradle/README.md",
        category:"gradle"
    }
]

/**
 * 拉取中需要锁上避免访问
 */
let lock = false

/**
 * 拉取Android libs数据
 */
const fetchData = () => {
    let scanInterval = setInterval(() => {
        if (!lock) {

            lock = true

            let target = targets.pop()

            //如果拉取完，清除Interval
            if (!target) {
                clearInterval(scanInterval)
                console.log('Scan Complate！')
            } else {
                console.log('prepare scan ' + target.category)
                console.log('Only ' + targets.length + ' left now')
                scan(target.link, target.category)
            }
        }
    }, 1000)
}

const scan = (link, category) => {
    request(link, {
        timeout: 60000
    }, function (err, response, body) {
        let errorHandler = (err) => {
            console.log(err)
            targets.push({
                link: link,
                category: category
            })
            lock = false
            return
        }

        if (err) {
            errorHandler(err)
        } else {
            console.log("Request 【" + category + "】 Complate ... ")

            try {
                parse(body, category)
            } catch (err) {
                errorHandler(err)
            }
        }

    })
}

const parse = (body, category) => {

    let list = []

    let $ = cheerio.load(body)

    $('hr').each(function (i, elememt) {
        let e = elememt.next.next

        let itemName;
        let itemLink;
        let itemRemark;
        if (!e) return;

        if (e.firstChild.firstChild) {
            itemName = e.firstChild.firstChild.data
        } else {
            return
        }

        itemLink = e.lastChild.lastChild.data
        e = nextBlock(e)
        itemRemark = e.firstChild.data
        e = nextBlock(e)


        list.push({
            name: itemName,
            link: itemLink,
            description: itemRemark,
            category: category
        })
    })

    console.log(category + ' have ' + list.length + ' item')

    let putMongoDBInterval = setInterval(function () {
        if (list.length > 0) {
            console.log(list.length + ' left')
            let item = list.pop()
            saveDB(item)
        } else {
            clearInterval(putMongoDBInterval)
            lock = false
            console.log('-------------------------------------------')
        }
    }, 300)

}

const nextBlock = (elememt) => {
    return elememt.next.next
}

/**
 * 分析link是否是github的
 * 
 * @returns resolve 是github的link，并返回owner和repo
 *          reject 不是github的link
 */
const analyzeLink = (link) => {
    return new Promise((resolve, reject) => {
        let target = 'https://github.com/'

        if (link.match(target)) {
            link = link.replace(target, '')
            let arr = link.match(/([^\/]+)/g)

            resolve({
                owner: arr[0],
                repo: arr[1]
            })

        } else {
            reject("不是github的link")
        }

    })
}

const saveDB = (item) => {
    // console.log(item)

    let options = {
        method: 'POST',
        headers: {
            'content-type': 'application/json'
        },
        body: item,
        json: true
    }

    //判断是GitHub的还是其他网址
    analyzeLink(item.link).then(() => {
        //GitHub
        options.url = "http://localhost:9000/repos"
        request(options, function (err, response, body) {
            if (err) {
                throw new Error(err);
            } else {
                // console.log(response)
            }

            // console.log(body)
        })
    }, () => {
        //其他
        options.url = "http://localhost:9000/websites"
        request(options, function (err, response, body) {
            if (err) {
                console.error(err)
            } else {
                // console.log(response)
                console.log(body)
            }
        })
    })
}

schedule.scheduleJob({
    dayOfWeek: [0, 1, 2, 3, 4, 5, 6],
    hour: 8,
    minute: 0 //每天
}, () => {
    fetchData()
})

// fetchData()