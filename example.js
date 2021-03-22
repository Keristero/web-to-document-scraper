const { FeatureType, Web2DocScraper } = require('./main.js')
const fs = require('fs');
let testScraper = new Web2DocScraper()

async function test() {
    //Add a feature for "Children", this will be any container type TAG, we add any of these tags to
    //the stack to create a deeply nested document
    let ChildFeature = new FeatureType(true, "children")
    let childTags = ["HTML", "CENTER", "NAV", "BODY", "DIV", "SECTION", "SPAN", "UL", "LI", "TBODY", "TABLE", "TR", "TD", "B"]
    for(let tag of childTags){
        testScraper.addFeatureType(tag, ChildFeature)
    }

    //Add a feature for "Links", which will also record the src or href link to the page
    let LinkFeature = new FeatureType(false, "links",{"href":"link","src":"link","textContent":"textContent"})
    testScraper.addFeatureType("A", LinkFeature)

    //Add a feature for "Text", which will include the text content attribute
    let TextFeature = new FeatureType(false, "text",{"textContent":"textContent"})
    let textTags = ["P","H1","H2","H3","H4"]
    for(let tag of textTags){
        testScraper.addFeatureType(tag, TextFeature)
    }

    //Add a feature for "Images", which will contain the image source and alt text as a description
    let ImageFeature = new FeatureType(false, "images",{"src":"link","alt":"description"})
    testScraper.addFeatureType("IMG", ImageFeature)
    

    let res = await testScraper.scrape('https://en.wikipedia.org/wiki/Main_Page')
    fs.writeFileSync('./output.json', JSON.stringify(res, null, 2))
}
test()