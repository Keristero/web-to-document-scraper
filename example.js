let Web2DocScraper = require('./main.js')
let testScraper = new Web2DocScraper()

async function test(){
    let res = await testScraper.scrape('https://en.wikipedia.org/wiki/Main_Page')
    fs.writeFileSync('./output.json',JSON.stringify(res, null, 2))
}
test()