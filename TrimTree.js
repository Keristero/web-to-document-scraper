function TrimTree(tree,childCollectionName="children"){
    let stack = [tree]
    //let trimmedNodes = 0
    //Give every node an association to it's parent
    while(stack.length > 0){
        let node = stack.shift()
        let children = node?.features?.[childCollectionName]
        if(!children){
            continue
        }
        for(let child of children){
            child.parent = node
            stack.push(child)
        }
    }

    //remove unwanted nodes
    stack = [tree]
    while(stack.length > 0){
        let node = stack.shift()
        let children = node?.features?.[childCollectionName]
        
        //Check if node is unwanted
        let unwanted = true

        //An unwanted node is a node which does not have much going on.
        //An empty node will atleast have a parent, so we want minimum one more thing than that
        let requiredAttributes = 2
        let requiredFeatures = 1
        if(children){
            //If a node has children it will have atleast "features" and "children"
            //so we need to raise the requirements
            requiredFeatures += 1
            if(children.length > 1){
                //If a node has more than one child, it is automatically important enough to stay
                unwanted = false
            }
        }
        //Count features and attributes
        let attributes = Object.keys(node).length
        let features = 0
        if(node.features){
            requiredAttributes += 1
            features = Object.keys(node.features).length
        }
        if(attributes >= requiredAttributes || features >= requiredFeatures){
            unwanted = false
        }

        if(children){
            for(let child of children){
                //If a node has children we need to iterate over them, so add them to stack
                stack.push(child)
                if(unwanted && node.parent){
                    //If a node should be removed, transfer it's children to the node's parent
                    child.parent = node.parent
                    node?.parent?.features?.[childCollectionName].push(child)
                }
            }
        }

        if(unwanted && node.parent){
            //If the node is unwanted, and it is NOT the root node (it has a parent)
            //remove this node from the tree by removing it from it's parent
            let nodeIndex = node?.parent?.features?.[childCollectionName]?.indexOf(node)
            if(nodeIndex != undefined){
                node.parent.features[childCollectionName].splice(nodeIndex,1)
                if(node.parent.features[childCollectionName].length == 0){
                    //If there are now no children, delete the children array
                    delete node.parent.features[childCollectionName]
                    stack.push(node.parent)
                }
                //trimmedNodes++
                //stack.push(node.parent)
            }
        }
    }

    //Now loop over the tree again and remove the circular parent references
    stack = [tree]
    while(stack.length > 0){
        let node = stack.shift()
        let children = node?.features?.[childCollectionName]
        if(children){
            for(let child of children){
                //If a node has children we need to iterate over them, so add them to stack
                stack.push(child)
            }
        }
        delete node.parent
    }

    //console.log(`trimmed ${trimmedNodes} nodes`)
    return tree
}

module.exports = TrimTree