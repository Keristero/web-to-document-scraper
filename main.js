const axios = require('axios');
const { JSDOM } = require('jsdom')
var fs = require('fs');

class FeatureType{
    constructor(addToStack=true,collection=false){
        this.addToStack = addToStack
        this.collection = collection
    }
}

class Web2DocScraper{
    constructor(){
        //Any HTML element matching the child type will become a document node

        this.defaultAttributes = {
            "tagName":"tagName"
        }

        this.textElementAttributes = {
            ...this.defaultAttributes,
            "textContent":"textContent"
        }

        this.linkElementAttributes = {
            ...this.defaultAttributes,
            "href":"link",
            "src":"link"
        }

        this.featureTypes = {
            "HTML":{addToStack:true,collection:"Rooms"},
            "CENTER":{addToStack:true,collection:"Rooms"},
            "NAV":{addToStack:true,collection:"Rooms"},
            "BODY":{addToStack:true,collection:"Rooms"},
            "DIV":{addToStack:true,collection:"Rooms"},
            "SECTION":{addToStack:true,collection:"Rooms"},
            "SPAN":{addToStack:true,collection:"Rooms"},
            "UL":{addToStack:true,collection:"Lists"},
            "LI":{addToStack:true,collection:"Lists"},
            "TBODY":{addToStack:true,collection:"Tables"},
            "TABLE":{addToStack:true,collection:"Tables"},
            "TR":{addToStack:true,collection:"Tables"},
            "TD":{addToStack:true,collection:"Tables"},
            "B":{addToStack:true,collection:"Rooms",attributes:this.textElementAttributes},
            "A":{addToStack:false,collection:"Warps",attributes:this.linkElementAttributes},
            "P":{addToStack:false,collection:"Prog",attributes:this.textElementAttributes},
            "H1":{addToStack:false,collection:"Prog",attributes:this.textElementAttributes},
            "H2":{addToStack:false,collection:"Prog",attributes:this.textElementAttributes},
            "H3":{addToStack:false,collection:"Prog",attributes:this.textElementAttributes},
            "H4":{addToStack:false,collection:"Prog",attributes:this.textElementAttributes},
            "IMG":{addToStack:false,collection:"Images",attributes:this.linkElementAttributes},
        }
    }
    addChildrenToStack(stack,element,node){
        for(let child of element.children){
            if(this.featureTypes[child.tagName]){
                let collection = this.featureTypes[child.tagName].collection
                let addToStack = this.featureTypes[child.tagName].addToStack
                if(addToStack){
                    child.superNode = node
                    stack.push(child)
                }else{
                    let featureNode = {}
                    this.addPropertiesToNode(featureNode,child)
                    this.addFeature(node,collection,featureNode)
                }
            }
        }
    }
    addFeature(node,collection,featureNode){
        if(collection){
            if(!node.features[collection]){
                node.features[collection] = []
            }
            node.features[collection].push(featureNode)
        }
    }
    addPropertiesToNode(node,element){
        let featureType = this.featureTypes[element.tagName]
        let attributeTypes = this.defaultAttributes
        if(featureType && featureType.attributes){
            attributeTypes = featureType.attributes
        }
        for(let key in element){
            if(attributeTypes[key]){
                let keyValue = element[key]
                if(typeof keyValue == "string"){
                    keyValue = keyValue.trim()
                }
                if(keyValue != ""){
                    node[attributeTypes[key]] = keyValue
                }
            }
        }
    }
    iterateOverDOMStack(stack){
        let output;
        let firstNode = true
        while(stack.length > 0){
            var element = stack.shift()
            var node = {features:{}}
            if(firstNode){
                output = node
                firstNode = false
            }
            this.addPropertiesToNode(node,element)
            this.addChildrenToStack(stack,element,node)
            let superNode = element.superNode
            if(superNode != undefined){
                if(this.featureTypes[element.tagName]){
                    let collection = this.featureTypes[element.tagName].collection
                    this.addFeature(superNode,collection,node)
                }
            }
        }
        return output
    }
    async scrape(url){
        let dom = await JSDOM.fromURL(url)
        let output = this.iterateOverDOMStack([dom.window.document])
        return output
    }
}

module.exports = Web2DocScraper