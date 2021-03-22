const { JSDOM } = require('jsdom')
const TrimTree = require('./TrimTree')

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
        let hasKids = false
        for(let child of element.children){
            if(this.featureTypes[child.tagName]){
                let collection = this.featureTypes[child.tagName].collection
                let addToStack = this.featureTypes[child.tagName].addToStack
                hasKids = true
                if(addToStack){
                    child.superNode = node
                    stack.push(child)
                }else{
                    let featureNode = {}
                    this.addPropertiesToNode(featureNode,child)
                    this.addFeature(node,collection,featureNode,hasKids)
                }
            }
        }
        return hasKids
    }
    addFeature(node,collection,featureNode,hasKids){
        if(collection){
            if(!hasKids){
                if(Object.keys(featureNode).length == 0){
                    return
                }
            }
            if(!node.features){
                node.features = {}
            }
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
            var node = {}
            if(firstNode){
                output = node
                firstNode = false
            }
            this.addPropertiesToNode(node,element)
            let hasKids = this.addChildrenToStack(stack,element,node)

            //Add this node to it's parents children
            let superNode = element.superNode
            if(superNode != undefined){
                if(this.featureTypes[element.tagName]){
                    let collection = this.featureTypes[element.tagName].collection
                    this.addFeature(superNode,collection,node,hasKids)
                }
            }
        }
        return output
    }
    /**
     * 
     * @param {string} url path to website or file to scrape
     * @param {boolean} fromFile flag to indicate if this is a file
     * @param {boolean} trim flag to indicate if we should trim unimportant nodes from the tree
     * @returns 
     */
    async scrape(url,fromFile=false,trim=true){
        let dom;
        if(fromFile){
            dom = await JSDOM.fromFile(url)
        }else{
            dom = await JSDOM.fromURL(url)
        }
        let output = this.iterateOverDOMStack([dom.window.document])

        if(trim){
            output = TrimTree(output)
        }
        return output
    }
}

module.exports = {Web2DocScraper,FeatureType}