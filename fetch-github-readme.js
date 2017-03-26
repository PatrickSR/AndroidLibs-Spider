const schedule = require('node-schedule')

const request = require('request')
const cheerio = require('cheerio')

request('https://github.com/indexzero/http-server', (err, response, body) => {
    if(err){
        throw new Error(err)
    }else{
        let $ = cheerio.load(body)
    }
})