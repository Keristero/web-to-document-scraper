function TrimTree(tree,childCollectionName="children"){
    //Keep iterating until our last iteration trimmed 0 nodes
    let trimmedNodes = 1
    while(trimmedNodes > 0){
        let stack = [tree]
        let node
        trimmedNodes = 0
        //Give every node an association to it's parent
        while(stack.length > 0){
            node = stack.shift()
            for(let featureCollectionName in node.features){
                for(let feature of node.features[featureCollectionName]){
                    feature.parent = node
                    feature.type = featureCollectionName
                    stack.push(feature)
                }
            }
            let unwanted = true
    
            let node_feature_count = countFeatures(node)
            if(node_feature_count > 1){
                unwanted = false
            }
    
            if(unwanted && node.parent && node.features){
                transferFeaturesFromNodeToNode(node,node.parent)
                if(node?.parent?.features?.[node?.type]){
                    if(countFeatures(node) == 0){
                        removeFromArray(node.parent.features[node.type],node)
                        trimmedNodes++
                    }
                }
            }
        }
    
        //Now loop over the tree again and remove the circular parent references
        stack = [tree]
        while(stack.length > 0){
            node = stack.shift()
            for(let featureCollectionName in node.features){
                for(let feature of node.features[featureCollectionName]){
                    stack.push(feature)
                }
            }
            if(node.parent){
                delete node.parent
            }
            if(node.type){
                delete node.type
            }
        }
        console.log(`trimmed ${trimmedNodes} nodes`)
    }

    console.log(JSON.stringify(tree))
    return tree
}

function transferFeaturesFromNodeToNode(nodeA,nodeB){
    for(let featureCollectionName in nodeA.features){
        for(let feature of nodeA.features[featureCollectionName]){
            if(!nodeB?.features?.[featureCollectionName]){
                nodeB.features[featureCollectionName] = []
            }
            nodeB.features[featureCollectionName].push(feature)
            removeFromArray(nodeA.features[featureCollectionName],feature)
            if(nodeA.features[featureCollectionName].length == 0){
                delete nodeA.features[featureCollectionName]
            }
        }
    }
}

function removeFromArray(array, value) {
    var idx = array.indexOf(value);
    if (idx !== -1) {
        array.splice(idx, 1);
    }
    return array;
}

function countFeatures(node){
    let count = 0
    if(node.features){
        for(let featureCollectionName in node.features){
            for(let feature of node.features[featureCollectionName]){
                count++
            }
        }
    }
    return count
}

module.exports = TrimTree