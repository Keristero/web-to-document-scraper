//puppeteer extra with stealth plugin to bypass cloudflare
const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())


async function scraper(url){
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setJavaScriptEnabled(true);
    await page.goto(url);
    const result = await page.evaluate(() => {
        function record_attributes(node,element,attribute_names){
            for(let attribute_name of attribute_names){
                if(element[attribute_name]){
                    node[attribute_name] = element[attribute_name]
                    node.importance += 1
                }
            }
        }
        function record_attributes_for_tag(node,element,tag_name,attribute_names){
            if(node.tag == tag_name){
                record_attributes(node,element,attribute_names)
            }
        }
        function record_style(node,element,style_name,default_value_to_ignore){
            let style_value = window.getComputedStyle(element,null).getPropertyValue(style_name);  
            if(style_value != default_value_to_ignore){
                node[style_name] = style_value
                node.importance += 1
            }
        }
        function scrape_extra_data(node,element){
            record_attributes_for_tag(node,element,"A",["href"])
            record_attributes_for_tag(node,element,"IMG",["src","alt"])
            record_style(node,element,'background-color','rgba(0, 0, 0, 0)')
            record_style(node,element,'background-image','none')
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
    await browser.close();
    return result
}

module.exports = scraper