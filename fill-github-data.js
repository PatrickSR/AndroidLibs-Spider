//把本地的github仓库的star fork watch等资料补全
const request = require('request')

const markdown = require("markdown").markdown;

// const config = require('../config');
const bluebird = require('bluebird');

const GitHubApi = require("github");

const GITHUB_ACCESS_TOKEN = 'f6bee44b0af9a55edb05e48f5248e25ac0fc1400'

const url = require('./options').home;

let showdown  = require('showdown');
showdown.setOption('omitExtraWLInCodeBlocks',true);
let converter = new showdown.Converter();

let _lock = false
/**
 * 消费时将把lock锁上
 */
const lock = () => {
    _lock = true
}

/**
 * 去掉锁
 */
const unlock = () => {
    _lock = false
}

let github = new GitHubApi({
    debug: false,
    protocol: "https",
    host: "api.github.com", // should be api.github.com for GitHub 
    pathPrefix: "", // for some GHEs; none for GitHub 
    headers: {
        "user-agent": "Android-Libs-Spider" // GitHub is happy with a unique user agent 
    },
    Promise: bluebird,
    followRedirects: false, // default: true; there's currently an issue with non-get redirects, so allow ability to disable follow-redirects 
    timeout: 30000
})

//增加github认证
github.authenticate({
    type: "oauth",
    token: GITHUB_ACCESS_TOKEN
});


let libsArray

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

/**
 * 填充github
 */
const fills = (libs) => {

    libsArray = libs
    //启动Interval
    setInterval(function () {
        if (!_lock) {

            lock()

            let lib = libsArray.pop()
            console.log('剩余 ' + libsArray.length + ' 项')
            let owner;
            let repo;

            let githubInfo;
            let githubReadme;

            analyzeLink(lib.link)
                .then((result) => {
                    //解析完github的地址，获取Repo Info
                    owner = result.owner
                    repo = result.repo

                    return fetchGithubRepo(owner, repo)
                })
                .then((result) => {
                    githubInfo = result.data
                    return fetchGithubReadme(owner, repo)
                })
                .then((result) => {
                    githubReadme = result.data
                    return save(lib, githubInfo, githubReadme)
                })
                // .then(() => {
                //     return new Promise((resolve, reject) => {
                //         //删除同步的repo
                //         console.log('删除同步的repo')
                //         var options = {
                //             method: 'DELETE',
                //             url: 'http://localhost:9000/waiting-audit-repos/' + lib.id,
                //             headers: {
                //                 'content-type': 'application/json'
                //             },
                //             body: {
                //                 access_token: 'kCUkvv0xPXRZ7uCe942w6LEjSIgnq2n6'
                //             },
                //             json: true
                //         };

                //         request(options, function (error, response, body) {
                //             if (error){
                //                 reject(error)
                //             }else{
                //                 resolve()
                //             }
                //         });
                //     })
                // })
                .then((success) => {
                    unlock()
                    console.log('sync 【' + owner + '】' + ' 【' + repo + '】成功')
                })
                .catch((err) => {
                    unlock()
                    console.log(err)
                })


        }
    }, 100)

}

/**
 * 拉去github的资料
 * 
 * @param owner 作者/组织
 * @param repo 仓库名称
 * @returns Promise
 */
const fetchGithubRepo = (owner, repo) => {
    console.log('fetchGithubRepo 【' + owner + '】' + ' 【' + repo + '】')

    return github.repos.get({
        owner,
        repo
    })
}

const fetchGithubReadme = (owner, repo) => {
    console.log('fetchGithubRepo 【' + owner + '】' + ' 【' + repo + '】Readme')
    return github.repos.getReadme({
        owner,
        repo
    })
}

/**
 * 保存
 * @param {*} lib 
 * @param {*} githubInfo 
 * @param {*} githubReadme 
 */
const save = (lib, githubInfo, githubReadme) => {
    return new Promise((resolve, reject) => {
        
        console.log('保存中...')

        if(!githubReadme.download_url){
            console.log('download_url 不存在')
        }
        
        request(githubReadme.download_url, (error, response, body) => {
            if (!error) {
                let readme;
                try {
                    // readme = markdown.toHTML(body)
                    readme = converter.makeHtml(body)
                } catch (e) {
                    reject(e)
                }

                // let readme = body

                var options = {
                    method: 'PUT',
                    url: url+'/repos/'+lib.id,
                    headers: {
                        'content-type': 'application/json'
                    },
                    body: {
                        access_token: 'kCUkvv0xPXRZ7uCe942w6LEjSIgnq2n6',
                        name:lib.name,
                        link:lib.link,
                        category:lib.category,
                        star: githubInfo.stargazers_count,
                        fork: githubInfo.forks_count,
                        watch: githubInfo.subscribers_count,
                        readme: readme
                    },
                    json: true
                };

                request(options, (error, response, body) => {
                    if (!error) {
                        resolve('保存成功')
                    } else {
                        reject(error)
                    }
                });
            } else {
                console.log(lib)
                reject(error)
            }
        })
    })
}

//获取完整列表
request(url+'/repos?page=1&limit=2000&category=gradle', (error, response, body) => {
    fills(JSON.parse(body))
})

// fetchGithubReadme('jaredsburrows','gradle-license-plugin').then((result)=>{
//     console.log(result)
// })