Scrapes a website and produces a JSON tree featuring only the tags and attributes you specify.

# Example script:
```js
const { FeatureType, Web2DocScraper } = require('./main.js')
const fs = require('fs');
let testScraper = new Web2DocScraper()


async function test() {
    //Add a feature for "Children", this will be any containerish tag
    //By specifying true here we are specifying that we should add all of these
    //tags to the stack for recursive processing
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
    

    let res = await testScraper.scrape('./index.html',true)
    fs.writeFileSync('./output.json', JSON.stringify(res, null, 2))
}
test()
```
# Example HTML

```html
<html>
<head>
    <title> A test site</title>
</head>
<style>
    body {
        background-color: black;
    }
</style>
<body>
    <h1>BIG HEADING RAWR</h1>
    <p>Hi, this is a paragraph</p>
    <div style="background-color:aqua">
        <a href="index.html" style="color:green">ACDC</a>
        <a href="index.html" style="color:grey">DEN</a>
        <a href="index.html" style="color:yellow">YUMNET</a>
        <a href="index.html" style="color:purple">WWW</a>
        <div></div>
    </div>
    <div style="background-color:blueviolet">
        <a href="index.html">Hey</a>
        <a href="index.html">How</a>
        <a href="index.html">Are</a>
        <a href="index.html">You</a>
    </div>
</body>

</html>
```

# Example Output
```
{
  "features": {
    "children": [
      {
        "features": {
          "children": [
            {
              "features": {
                "text": [
                  {
                    "textContent": "BIG HEADING RAWR"
                  },
                  {
                    "textContent": "Hi, this is a paragraph"
                  }
                ],
                "children": [
                  {
                    "features": {
                      "links": [
                        {
                          "link": "file:///home/jn1mm0cool/repos/web-to-document-scraper/index.html",
                          "textContent": "ACDC"
                        },
                        {
                          "link": "file:///home/jn1mm0cool/repos/web-to-document-scraper/index.html",
                          "textContent": "DEN"
                        },
                        {
                          "link": "file:///home/jn1mm0cool/repos/web-to-document-scraper/index.html",
                          "textContent": "YUMNET"
                        },
                        {
                          "link": "file:///home/jn1mm0cool/repos/web-to-document-scraper/index.html",
                          "textContent": "WWW"
                        }
                      ],
                      "children": [
                        {
                          "features": {}
                        }
                      ]
                    }
                  },
                  {
                    "features": {
                      "links": [
                        {
                          "link": "file:///home/jn1mm0cool/repos/web-to-document-scraper/index.html",
                          "textContent": "Hey"
                        },
                        {
                          "link": "file:///home/jn1mm0cool/repos/web-to-document-scraper/index.html",
                          "textContent": "How"
                        },
                        {
                          "link": "file:///home/jn1mm0cool/repos/web-to-document-scraper/index.html",
                          "textContent": "Are"
                        },
                        {
                          "link": "file:///home/jn1mm0cool/repos/web-to-document-scraper/index.html",
                          "textContent": "You"
                        }
                      ]
                    }
                  }
                ]
              }
            }
          ]
        }
      }
    ]
  }
}
```