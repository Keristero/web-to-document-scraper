const { JSDOM } = require('jsdom')
const TrimTree = require('./TrimTree')

class AttributeType{
    constructor(htmlAttribute,documentName,required=false,styleName){
        this.htmlAttribute = htmlAttribute
        this.documentName = documentName
        this.required = required
        this.styleName = styleName
    }
}
class FeatureType{
    constructor(addToStack=true,collection=false, attributes = []){
        this.addToStack = addToStack
        this.collection = collection
        this.attributes = attributes
    }
}

class Web2DocScraper{
    constructor(){
        //Any HTML element matching the child type will become a document node

        this.featureTypes = {}
        this.window = null
    }
    addFeatureType(htmlTag,featureType){
        this.featureTypes[htmlTag] = featureType
    }
    addChildrenToStack(stack,element,node){
        let hasKids = false
        for(let childElement of element.children){
            if(this.featureTypes[childElement.tagName]){
                let collection = this.featureTypes[childElement.tagName].collection
                let addToStack = this.featureTypes[childElement.tagName].addToStack
                hasKids = true
                if(addToStack){
                    childElement.superNode = node
                    stack.push(childElement)
                }else{
                    let featureNode = {}
                    let allRequirementsMet = this.addPropertiesToNode(featureNode,childElement)
                    if(allRequirementsMet){
                        this.addFeature(node,collection,featureNode,hasKids)
                    }
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
        let styleInfo = this.window.getComputedStyle(element)
        let allRequirementsMet = true
        if(featureType && featureType.attributes){
            for(let attribute of featureType.attributes){
                let attributeTag = attribute.htmlAttribute

                let value;

                if(attribute.styleName){
                    value = styleInfo.getPropertyValue(attribute.styleName)
                }else{
                    value = element[attributeTag]
                }

                if(typeof value == "string"){
                    value = value.trim()
                }
                if(value){
                    node[attribute.documentName] = value
                }else{
                    if(attribute.required){
                        allRequirementsMet = false
                    }
                }
            }
        }
        return allRequirementsMet
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
        this.window = dom.window
        let output = this.iterateOverDOMStack([dom.window.document.body])

        if(trim){
            output = TrimTree(output)
        }
        return output
    }
}

module.exports = {Web2DocScraper,FeatureType,AttributeType}