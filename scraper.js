//puppeteer extra with stealth plugin to bypass cloudflare
const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

const goto_page_options = {
    timeout:30000,
    waitUntil:"networkidle2"
}

async function scraper(url){
    //console.log('launching browser')
    const browser = await puppeteer.launch();
    //console.log('opening new page')
    const page = await browser.newPage();
    //console.log('enabling js')
    await page.setJavaScriptEnabled(true);
    //console.log('going to url')
    await page.goto(url,goto_page_options);
    //console.log('evaluating script')
    const result = await page.evaluate(() => {
        function record_attributes(node,element,attribute_names,importance){
            for(let attribute_name of attribute_names){
                if(element[attribute_name]){
                    node[attribute_name] = element[attribute_name]
                    node.importance += importance
                }
            }
        }
        function record_attributes_for_tag(node,element,tag_name,attribute_names,importance){
            if(node.tag == tag_name){
                record_attributes(node,element,attribute_names,importance)
            }
        }
        function record_style(node,element,style_name,default_value_to_ignore,importance){
            let style_value = window.getComputedStyle(element,null).getPropertyValue(style_name);  
            if(style_value != default_value_to_ignore){
                node[style_name] = style_value
                node.importance += importance
            }
        }
        function scrape_extra_data(node,element){
            record_attributes(node,element,"id",1)
            record_attributes_for_tag(node,element,"A",["href"],1)
            record_attributes_for_tag(node,element,"IMG",["src","alt"],1)
            record_style(node,element,'background-color','rgba(0, 0, 0, 0)',1)
            //record_style(node,element,'background-image','none',1) often causes generation failure with gradients
        }
        function getTextFromElement(element){
            let text = ""
            if(element.childNodes.length == 0){
                //dont add text of elements with children because it will be duplicated
                if(element?.dataset?.title){
                    text += element.dataset.title
                }
                if(element.textContent){
                    text += element.textContent
                }
                if(element.innerText){
                    text += element.innerText
                }
            }
            for( child_node of element.childNodes){
                if (child_node.nodeType === Node.TEXT_NODE){
                    text += child_node.textContent;
                }
            }
            text = text.replace(/(\r\n|\t|\n|\r)/gm, "")//remove new line characters
            text = text.replace(/\s+/g, " ")//remove consecutive spaces
            return text.trim()//remove leading and trailing spaces
        }
        let queue = []
        let first_node = {element:document,children:[]}
        queue.push(first_node)
        while (queue.length > 0) {
            let node = queue.shift()
            for(let child of node.element.children){
                let child_node = {tag:child.tagName,element:child,children:[],text:getTextFromElement(child),importance:0}
                if(child_node.text == ""){
                    delete child_node.text
                }else{
                    //having text on the node adds importance
                    child_node.importance += 1
                }

                scrape_extra_data(child_node,child)

                node.children.push(child_node)
                queue.push(child_node)
            }
            delete node.element //we dont need it anymore
        }
        return first_node
    });
    //console.log('closing browser')
    browser.close();
    //console.log('scraping done')
    return result
}

module.exports = scraper