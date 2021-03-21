const { JSDOM } = require('jsdom')

class FeatureType{
    constructor(addToStack=true,collection=false, attributes = {}){
        this.addToStack = addToStack
        this.collection = collection
        this.attributes = attributes
    }
}

class Web2DocScraper{
    constructor(){
        //Any HTML element matching the child type will become a document node

        this.featureTypes = {}
    }
    addFeatureType(htmlTag,featureType){
        this.featureTypes[htmlTag] = featureType
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
        if(featureType && featureType.attributes){
            let attributeTypes = featureType.attributes
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
    async scrape(url,fromFile=false){
        let dom;
        if(fromFile){
            dom = await JSDOM.fromFile(url)
        }else{
            dom = await JSDOM.fromURL(url)
        }
        let output = this.iterateOverDOMStack([dom.window.document])
        return output
    }
}

module.exports = {Web2DocScraper,FeatureType}