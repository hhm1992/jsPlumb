var target,//当前点击的元素
    targetNodeName,//当前点击的元素的nodeName
    targetNode,//当前点击的block
    targetNodeWidth,//当前点击的block的width
    targetNodeTop,//当前点击的block的top
    targetNodeLeft,//当前点击的block的left
    newNode,//新生成的block
    newNodeHeight,//新生成的block的height
    instance,//jsPlumb的一个实例
    decisionTree={//存放决策树所有内容数据的对象
        start:{
            'id':'start',
            'css':{
                'top':"20px",
                'left':'0'
            },
            'data':{'data-nodeType':'mold'},
            'subIds':{}
        }
    },
    sourceId=[],//存放所有有子节点的block的id
    n=0,//初始化子节点的总个数为0
    m=0,//新生成的node的id中的数字
    index,//当前点击block在父节点所有子节点中的位置（1/2/3....）
    oldTagId,//第一次添加子节点的block的id
    subIdsTop=[];//存放所有子节点的top值
//connectorPaintStyle:基本连接线样式
var connectorPaintStyle = {
    stroke: "blue",
    strokeWidth: 2
};
/*作用：下拉菜单显示
 $("#treeContainer")：盛放决策树的容器
 $(".dropDown-menu")：下拉菜单
 target：当前点击的元素
 targetNodeName：当前点击的元素的nodeName
 targetNode：当前点击的block
 targetNodeWidth：当前点击的block的width
 targetNodeTop：当前点击的block的top
 targetNodeLeft：当前点击的block的left
 targetNodeType：当前点击的block的类型*/
$("#treeContainer").on("click","span,.nodeChoose",function(e){
    targetNodeName=e.target.nodeName;
    target=$(e.target);
    targetNode=target.parent();
    targetNodeWidth=targetNode.css("width");
    targetNodeTop=targetNode.css("top");
    targetNodeLeft=targetNode.css("left");
    var targetNodeType=targetNode.attr("data-nodeType");
    var html="";
    if(targetNodeName=="SPAN"&&targetNodeType=="mold"){
        html+="<li>选择变量</li><li>选择参数</li><li>选择方法</li><li>选择函数</li>";
    }
    else if(targetNodeName=="SPAN"&&targetNodeType=="condition"){
        html+="<li>大于</li><li>大于等于</li><li>小于</li><li>小于等于</li><li>等于</li><li>不等于</li>";
    }
    else if(targetNodeName=="SPAN"&&targetNodeType=="action"){
        html+="<li>打印内容到控制台</li><li>变量赋值</li><li>执行函数</li>";
    }
    else if(targetNodeName=="IMG"&&targetNodeType=="mold"&&targetNode.attr("id")=="start"){
        html+="<li>添加条件</li>";
    }
    else if(targetNodeName=="IMG"&&targetNodeType=="mold"){
        html+='<li>添加条件</li><li>删除</li>';
    }
    else if(targetNodeName=="IMG"&&targetNodeType=="condition"){
        html+='<li>添加条件</li><li>添加变量</li><li>添加动作</li><li>删除</li>';
    }
    else if(targetNodeName=="IMG"&&targetNodeType=="action"){
        html+='<li>删除</li><li>添加动作</li>';
    }
    var menuTop=(e.pageY+10)|| (e.clientY+$(window).scrollTop()+10);
    var menuLeft=(e.pageX-20)||(e.clientX+$(window).scrollLeft()-20);
    $(".dropDown-menu").html(html).css({"display":"block","top":menuTop,"left":menuLeft});
});
/*作用：创建新的data-nodetype="mold"的block("请选择类型")*/
var newMoldNode=function(){
    m++;
    var d=document.createElement("div");
    d.className="node moldNode";
    d.id="mold"+m;
    d.innerHTML='<span>请选择类型</span><img class="nodeChoose" src="images/ok.png" alt=""/>';
    d.dataset.nodetype="mold";
    instance.getContainer().appendChild(d);
    return d;
};
/*作用：创建新的data-nodetype="condition"的block("请选择比较操作符")*/
var newConditionNode=function(){
    m++;
    var d=document.createElement("div");
    d.className="node conditionNode";
    d.id="condition"+m;
    d.innerHTML='<span>请选择比较操作符</span><img class="nodeChoose" src="images/ok.png" alt=""/>';
    d.dataset.nodetype="condition";
    instance.getContainer().appendChild(d);
    return d;
};
/*作用：创建新的data-nodetype="action"的block("请选择动作类型")*/
var newActionNode=function(){
    m++;
    var d=document.createElement("div");
    d.className="node actionNode";
    d.id="action"+m;
    d.innerHTML='<img class="delNode" src="images/minus.png" alt=""/><span>请选择动作类型</span><img class="nodeChoose" src="images/ok.png" alt=""/>';
    d.dataset.nodetype="action";
    instance.getContainer().appendChild(d);
    return d;
};
/*作用：生成决策树数据结构
tagId:当前点击block的id
newId:新生成子节点的id*/
var decisionTreeJson=function(tagId,newId){
    if(tagId=="start"){
        decisionTree["start"]["subIds"]["count"]=n+1;
        decisionTree["start"]["subIds"][n+1]=newId;
        decisionTree["start"]["css"]["top"]=$("#start").css("top");
    }
    else{
        decisionTree[tagId]["subIds"]["count"]=n+1;
        decisionTree[tagId]["subIds"][n+1]=newId;
    }
    decisionTree[newId]={
        "id":newId,
        "css":{
            "top":$(newNode).css("top"),
            "left":$(newNode).css("left")
        },
        "data":{
            "data-nodetype":$(newNode).attr("data-nodetype"),//节点类型
            "data-parentId":tagId//子节点的父节点id
        },
        "subIds":{}
    };
};
/*作用：调整父级Block的top定位==》第一个子block和最后一个子block的中间位置*/
var parentIdTop=function(parentId){
    var parentIdSubIds=decisionTree[parentId]["subIds"];
    var parentIdSubIdsCount=parentIdSubIds["count"];
    var parentIdFirstSubId=parentIdSubIds[1];
    var parentIdFirstSubIdTop=parseFloat($("#"+parentIdFirstSubId).css("top"));
    var parentIdLastSubId=parentIdSubIds[parentIdSubIdsCount];
    var parentIdLastSubIdTop=parseFloat(decisionTree[parentIdLastSubId]["css"]["top"]);
    var nowParentIdTop=(parentIdLastSubIdTop-parentIdFirstSubIdTop)/2+parentIdFirstSubIdTop;
    $("#"+parentId).css("top",nowParentIdTop);
    decisionTree[parentId]["css"]["top"]=nowParentIdTop+"px";
};
/*作用：（添加时）计算一个block的新的top
 nodeId：节点id
 newHeight：新节点高度*/
var nodeNewTop=function(nodeId,newHeight){
    var nodeTop=parseFloat(decisionTree[nodeId]["css"]["top"]);
    var nowNodeTop=nodeTop+parseFloat(newHeight)+20;
    $("#"+nodeId).css("top",nowNodeTop);
    nodeTop=nowNodeTop;
    decisionTree[nodeId]["css"]["top"]=nodeTop+"px";
};
/*作用：（添加时）子级block的top定位
 count：子节点的总个数
 subIds：存放所有子节点id的对象
 newHeight：新节点高度*/
var subIdTop=function(count,subIds,newHeight){
    for(var j=1;j<=count;j++){
        nodeNewTop(subIds[j],newHeight);
        var subIdsSubIds=decisionTree[subIds[j]]["subIds"];//子级block下的子节点
        var subIdsSubIdsCount=subIdsSubIds["count"];
        if(subIdsSubIdsCount){
            subIdTop(subIdsSubIdsCount,subIdsSubIds,newHeight);//递归
        }
    }
};

/*作用：（添加时）调整当前点击block的兄弟节点的位置
tagId：当前点击blockId
newHeight：新子节点的高度*/
var resetBrotherPosition=function(tagId,newHeight){
    var tagParentId=decisionTree[tagId]["data"]["data-parentId"];//当前点击block的父block的id
    if(tagParentId){//如果存在父节点（即当前点击的不是第一个block）
        var tagParentSubIds=decisionTree[tagParentId]["subIds"];//tagParentSubIds：父节点下的所有子节点的id
        var tagParentSubIdsCount=tagParentSubIds["count"];//tagParentSubIdsCount：父节点下的所有子节点的个数
        for(items in tagParentSubIds){//index：当前点击节点在“父节点下的所有子节点”中的位置
            if(tagParentSubIds[items]==tagId){index = parseFloat(items);}
        }
        for(var i=index+1;i<=tagParentSubIdsCount;i++){//遍历当前点击节点下的兄弟节点
            if(decisionTree[tagParentSubIds[i]]){//如果当前点击block下面有block(即有兄弟节点)
                var tagBrotherSubIds=decisionTree[tagParentSubIds[i]]["subIds"];//tagBrotherSubIds：兄弟节点下的所有子节点的id
                var tagBrotherSubIdsCount=tagBrotherSubIds["count"];//tagBrotherSubIdsCount：兄弟节点下的所有子节点的个数
                if(!tagBrotherSubIdsCount){//如果兄弟节点没有子block==》只调整兄弟节点top位置
                    nodeNewTop(tagParentSubIds[i],newHeight);
                }
                else{//如果兄弟节点有子block==》调整兄弟节点和其子节点的top位置
                    var tagBrotherHasSubId=tagParentSubIds[i];
                    nodeNewTop(tagBrotherHasSubId,newHeight);
                    subIdTop(tagBrotherSubIdsCount,tagBrotherSubIds,newHeight);
                }
            }
        }
        parentIdTop(tagParentId);//调整父节点位置
    }
    if(tagParentId){
        resetBrotherPosition(tagParentId,newHeight);//递归==》调整父节点的兄弟节点位置
    }
};



jsPlumb.ready(function(){
    //instance:创建一个jsPlumb的实例
    instance=jsPlumb.getInstance({
        endpoint: "Blank",//端点无
        connectorStyle: connectorPaintStyle,//连接线的颜色，大小样式
        isTarget:true, //是否可以作为连线终点
        isSource:true, //是否可以作为连线起点
        Connector: ["StateMachine"], //连接线的样式种类有[Bezier],[Flowchart],[StateMachine],[Straight]
        maxConnections:-1, // 设置连接点最多可以连接几条线
        Container:"treeContainer"//容器
    });
    /*作用：（添加时）block位置
     tagWidth：当前点击block的width
     tagTop：当前点击block的top
     tagLeft：当前点击block的left
     newHeight：新子节点的高度
     newNode：新子节点
     tagNode：当前点击的block*/
    var newNodePosition=function(tagWidth,tagTop,tagLeft,newHeight,newNode,tagNode){
        var newNodeTop;//新的block的top
        var newNodeId=$(newNode).attr("id");//新的block的id
        var tagNodeId=tagNode.attr("id");//当前点击block的id
        if(sourceId.indexOf(tagNodeId)!==-1){//添加两个及两个以上子block时---》计算top
            var oldTagNodeTop=parseFloat(tagTop);//当前第一个子节点的top
            n++;//子节点的总个数累加
            var tagNodeTop=oldTagNodeTop+29.5;//当前点击block的top=原来的top+29.5
            tagNode.css("top",tagNodeTop);
            decisionTree[tagNodeId]["css"]["top"]=tagNodeTop+"px";//json数据更改
            var tagNodeSubIdsCount=decisionTree[tagNodeId]["subIds"]["count"];//tagNodeSubIdsCount：当前点击block下的子节点总个数
            if(tagNodeId==oldTagId){//如果当期点击blockId和上一次点击blockId相同
                n=tagNodeSubIdsCount;//n累加的数从“当前点击block下的子节点总个数”开始
                var lastTagSubId=decisionTree[tagNodeId]["subIds"][tagNodeSubIdsCount];//当前点击block下的最后一个子节点Id
                var lastTagSubIdTop=parseFloat(decisionTree[lastTagSubId]["css"]["top"]);//当前点击block下的最后一个子节点的top值
                newNodeTop=lastTagSubIdTop+parseFloat(newHeight)+20;//新的子节点的top=当前点击block下的最后一个子节点的top值+新子节点高度+20
            }
            else{//如果当期点击blockId和上一次点击blockId不同
                n=tagNodeSubIdsCount;//n累加的数从“当前点击block下的子节点总个数”开始
                var lastTagNodeSubId=decisionTree[tagNodeId]["subIds"][tagNodeSubIdsCount];//当前点击block下的最后一个子节点Id
                var lastTagNodeSubIdHasSubCount=decisionTree[lastTagNodeSubId]["subIds"]["count"];//当前点击block下的最后一个子节点中的子节点总个数
                if(!lastTagNodeSubIdHasSubCount){//如果当前点击block下的最后一个子节点没有子节点
                    var lastTagNodeSubIdTop=parseFloat(decisionTree[lastTagNodeSubId]["css"]["top"]);
                    newNodeTop=lastTagNodeSubIdTop+parseFloat(newHeight)+20;//新的子节点的top=当前点击block下的最后一个子节点的top+新子节点高度+20
                }
                else {//如果当前点击block下的最后一个子节点有子节点
                    var lastTagNodeSubIdHasLastSubId=decisionTree[lastTagNodeSubId]["subIds"][lastTagNodeSubIdHasSubCount];
                    var lastTagNodeSubIdHasLastSubIdSubIds=decisionTree[lastTagNodeSubIdHasLastSubId]["subIds"];
                    var lastTagNodeSubIdHasLastSubIdSubIdsCount=lastTagNodeSubIdHasLastSubIdSubIds["count"];
                    var lastTagNodeSubIdHasLastSubIdTop;
                    if(lastTagNodeSubIdHasLastSubIdSubIdsCount){
                        lastTagNodeSubIdHasLastSubIdTop=subIdMaxTop(lastTagNodeSubIdHasLastSubIdSubIds,lastTagNodeSubIdHasLastSubIdSubIdsCount);
                    }
                    else{
                        lastTagNodeSubIdHasLastSubIdTop=parseFloat(decisionTree[lastTagNodeSubIdHasLastSubId]["css"]["top"]);
                    }
                    newNodeTop=lastTagNodeSubIdHasLastSubIdTop+parseFloat(newHeight)+20;//新的子节点的top=当前点击block下的最后一个子节点后面所有子节点中的最大top+新子节点高度+20
                }
                oldTagId=tagNodeId;//oldTagId=当前点击blockId
            }
            $(newNode).css("top",newNodeTop);//新的子节点的top
            resetBrotherPosition(tagNodeId,newHeight);//调整当前点击block的兄弟节点的位置
        }
        else if(sourceId.indexOf(tagNodeId)===-1){//添加第一个子block时
            $(newNode).css("top",parseFloat(tagTop));//子节点的top和父节点一样
            oldTagId=tagNodeId;//oldTagId保存已经点击过的blockId
            sourceId.push(tagNodeId);//有子节点的blockId追加到sourceId数组中
            n=0;//子节点的总个数归0
        }
        /*添加子block时计算left*/
        if(tagLeft=="0px"){//如果当前点击的block的left=0，则其子节点的left=当前点击的block的宽度+60
            $(newNode).css("left",parseFloat(tagWidth)+60);
        }
        else{//如果当前点击的block的left>0，则其子节点的left=当前点击的block的宽度+前点击的block的left+60
            $(newNode).css("left",parseFloat(tagWidth)+parseFloat(tagLeft)+60);
        }
        /*将决策树数据记录到decisionTreeJson对象中*/
        decisionTreeJson(tagNodeId,newNodeId);
        /*将决策树连线显示*/
        instance.repaintEverything();
        instance.connect({
            source:tagNodeId,
            target:newNodeId,
            endpoint:"Blank",
            anchor:["Right", "Left"],
            Connector: [ "StateMachine"]
        },connectorPaintStyle);
    };
    /*作用：新建一个新的node和下拉菜单隐藏
     $("#treeContainer")：盛放决策树的容器
     $(".dropDown-menu")：下拉菜单
     target：当前点击的元素
     targetNodeName：当前点击的元素的nodeName*/
    $(".dropDown-menu").on("click","li",function(e){
        var chooseCondition=$(e.target).html();
        if(targetNodeName=="SPAN"){target.html(chooseCondition);}
        else if(targetNodeName=="IMG"){
            if(chooseCondition=="添加条件"){
                newNode=newConditionNode();
                newNodeHeight=$(newNode).css("height");
                newNodePosition(targetNodeWidth,targetNodeTop,targetNodeLeft,newNodeHeight,newNode,targetNode);
            }
            else if(chooseCondition=="添加变量"){
                newNode=newMoldNode();
                newNodeHeight=$(newNode).css("height");
                newNodePosition(targetNodeWidth,targetNodeTop,targetNodeLeft,newNodeHeight,newNode,targetNode);
            }
            else if(chooseCondition=="添加动作"){
                newNode=newActionNode();
                newNodeHeight=$(newNode).css("height");
                newNodePosition(targetNodeWidth,targetNodeTop,targetNodeLeft,newNodeHeight,newNode,targetNode);
            }
            else if(chooseCondition=="删除"){
                removeNode(targetNode);
            }

        }
        $(".dropDown-menu").css("display","none");
    });
});



/*作用：删除数组中某一项*/
var delValInArray=function(val,arr){
    var key;
    for(var i=0;i<arr.length;i++){
        if(arr[i]==val){key=i;}
    }
    arr.splice(key,1);
};

/*作用：删除子block
subIds：存放所有子节点的id
subIdsCount:所有子节点的个数*/
var delSubNode=function(subIds,subIdsCount){
    for(var i=1;i<=subIdsCount;i++){
        var subHasSubIds=decisionTree[subIds[i]]["subIds"];
        var subHasSubIdsCount=subHasSubIds["count"];
        if(subHasSubIdsCount){delSubNode(subHasSubIds,subHasSubIdsCount);}
        delete decisionTree[subIds[i]];
        var subNode=$("#"+subIds[i]);
        instance.removeAllEndpoints(subNode);
        subNode.remove();
    }
};
/*作用：查找所有子节点中最后一个子节点的height
subIds：存放所有子节点的id
subIdsCount:所有子节点的个数*/
var lastSubHeight=function(subIds,subIdsCount){
    var lastNodeHeight;
    var lastNodeId=subIds[subIdsCount];
    lastNodeHeight=$("#"+lastNodeId).css("height");
    for(var i=1;i<=subIdsCount;i++){
        var subIdsSubIds=decisionTree[subIds[i]]["subIds"];
        var subIdsSubIdsCount=subIdsSubIds["count"];
        if(subIdsSubIdsCount){lastSubHeight(subIdsSubIds,subIdsSubIdsCount);}
    }
    return lastNodeHeight;
};
/*作用：查找所有各级子节点中最小的top值
subIds：存放所有子节点的id
subIdsCount:所有子节点的个数
subIdsTop：存放所有子节点的top值*/
var subIdMinTop=function(subIds,subIdsCount){
    for(var i=1;i<=subIdsCount;i++){
        var nodeSubIdsTop=parseFloat(decisionTree[subIds[i]]["css"]["top"]);
        subIdsTop.push(nodeSubIdsTop);
        var subIdsSubIds=decisionTree[subIds[i]]["subIds"];
        var subIdsSubIdsCount=subIdsSubIds["count"];
        if(subIdsSubIdsCount){subIdMinTop(subIdsSubIds,subIdsSubIdsCount);}
    }
    var subMinTop=Math.min.apply(null,subIdsTop);
    return subMinTop;
};
/*作用：查找所有各级子节点中最大的top值
subIds：存放所有子节点的id
subIdsCount:所有子节点的个数
subIdsTop：存放所有子节点的top值*/
var subIdMaxTop=function(subIds,subIdsCount){
    for(var i=1;i<=subIdsCount;i++){
        var nodeSubIdsTop=parseFloat(decisionTree[subIds[i]]["css"]["top"]);
        subIdsTop.push(nodeSubIdsTop);
        var subIdsSubIds=decisionTree[subIds[i]]["subIds"];
        var subIdsSubIdsCount=subIdsSubIds["count"];
        if(subIdsSubIdsCount){subIdMaxTop(subIdsSubIds,subIdsSubIdsCount);}
    }
    var subMaxTop=Math.max.apply(null,subIdsTop);
    return subMaxTop;
};

/*作用：（删除时）计算一个block的新的top
nodeId：当前节点id
moveTop：要移动的top值*/
var delNodeNewTop=function(nodeId,moveTop){
    var nodeIdTop=parseFloat(decisionTree[nodeId]["css"]["top"]);
    var nowNodeIdTop=nodeIdTop-moveTop;
    $("#"+nodeId).css("top",nowNodeIdTop);
    nodeIdTop=nowNodeIdTop;
    decisionTree[nodeId]["css"]["top"]=nodeIdTop+"px";
};

/*作用：（删除时）子级block的top定位
count：子节点的总个数
subIds：所有子节点的id
moveTop：要移动的top值*/
var delSubIdTop=function(count,subIds,moveTop){
    for(var i=1;i<=count;i++){
        var subIdsSubIds=decisionTree[subIds[i]]["subIds"];//子级block下的子节点
        var subIdsSubIdsCount=subIdsSubIds["count"];
        if(subIdsSubIdsCount){
            delSubIdTop(subIdsSubIdsCount,subIdsSubIds,moveTop);
        }
        delNodeNewTop(subIds[i],moveTop);
    }
};

/*作用：（三级以上删除时）子级block的top定位
count：子节点的总个数
subIds：所有子节点的id
moveTop：要移动的top值
n：要移动的子节点的位置*/
var delMoreSubIdTop=function(count,subIds,moveTop,n){
    for(var i=n;i<=count;i++){
        var subIdsSubIds=decisionTree[subIds[i]]["subIds"];//子级block下的子节点
        var subIdsSubIdsCount=subIdsSubIds["count"];
        if(subIdsSubIdsCount){
            delSubIdTop(subIdsSubIdsCount,subIdsSubIds,moveTop);
        }
        delNodeNewTop(subIds[i],moveTop);
    }
};

/*作用：（删除时）调整兄弟节点位置
ind：当前要删除节点的位置
nodeParentSubIds：父节点下所有子节点的id
nodeParentSubIdsCount：父节点下所有子节点的个数
minTop：要移动到的top值*/
var removeBrotherNode=function(ind,nodeParentSubIds,nodeParentSubIdsCount,minTop){
    var move;//要移动的距离
    var brotherId=nodeParentSubIds[ind+1];//当前要删除的block的下一个兄弟节点
    if(brotherId){//当前要删除的block的下一个兄弟节点存在
        var brotherIdTop=parseFloat(decisionTree[brotherId]["css"]["top"]);
        var brotherIdSubIds=decisionTree[brotherId]["subIds"];
        var brotherIdSubIdsCount=brotherIdSubIds["count"];
        if(!brotherIdSubIdsCount){//如果当前要删除的block的下一个兄弟节点没有子节点
            move=brotherIdTop-minTop;
            delMoreSubIdTop(nodeParentSubIdsCount,nodeParentSubIds,move,(ind+1));
        }
        else{//如果当前要删除的block的下一个兄弟节点有子节点
            subIdsTop=[];
            var brotherIdSubIdsMinTop=subIdMinTop(brotherIdSubIds,brotherIdSubIdsCount);
            move=brotherIdSubIdsMinTop-minTop;
            delSubIdTop(brotherIdSubIdsCount,brotherIdSubIds,move);
            if(brotherIdSubIdsCount==1){//如果兄弟节点的子节点==1
                delNodeNewTop(brotherId,move);
            }
            else if(brotherIdSubIdsCount>1){//如果兄弟节点的子节点>1
                parentIdTop(brotherId);
            }
            delMoreSubIdTop(nodeParentSubIdsCount,nodeParentSubIds,move,(ind+2));
        }
    }
};
/*作用：（删除时）调整父节点/父节点的兄弟节点/父节点的父节点的位置
nodeParentId：当前要删除节点的父节点id
nodeParentSubIds：当前要删除节点的父节点的所有子节点
nodeParentSubIdsCount：当前要删除节点的父节点的所有子节点的个数*/
var removeParentBrother=function(nodeParentId,nodeParentSubIds,nodeParentSubIdsCount){
    var parentLastNodeHeight=lastSubHeight(nodeParentSubIds,nodeParentSubIdsCount);//parentLastNodeHeight：要删除的block的父节点的最后一个子节点的高度
    var nodeParentIdParentId=decisionTree[nodeParentId]["data"]["data-parentId"];//nodeParentIdParentId：要删除的block的父节点的父节点
    var newNodeParentIdParentIdTop;//要删除的block的父节点的父节点的新的top
    if(nodeParentIdParentId){//要删除的block的父节点的父节点存在的话（即父元素不是start）
        var nodeParentIdParentIdSubIds=decisionTree[nodeParentIdParentId]["subIds"];
        var nodeParentIdParentIdSubIdsCount=nodeParentIdParentIdSubIds["count"];
        var parentIndex,//当前要删除的block的父节点在"父节点的父节点的所有子节点"中的位置
            parentIdParentIdFirstSubId,//父节点的父节点的第一个子节点
            parentIdParentIdFirstSubIdTop,//父节点的父节点的第一个子节点的top值
            parentIdParentIdLastSubId,//父节点的父节点的最后一个子节点
            parentIdParentIdLastSubIdTop;//父节点的父节点的最后一个子节点的top值
        var parentMaxTop;//父节点中的最大top
        var minMove;//父节点的兄弟节点要移动到的位置
        var parentIdTop=parseFloat($("#"+nodeParentId).css("top"));//当前父元素的top
        if(!nodeParentSubIdsCount){//如果父节点中没有子节点==》parentMaxTop=父节点的top
            parentMaxTop=parentIdTop;
        }
        else{//如果父节点中有子节点==》parentMaxTop=父节点的子节点中的最大top
            subIdsTop=[];
            parentMaxTop=subIdMaxTop(nodeParentSubIds,nodeParentSubIdsCount);
        }

        if(parentLastNodeHeight){//如果删除block后父节点仍然有子节点
            minMove=parentMaxTop+parseFloat(parentLastNodeHeight)+20;//父节点的兄弟节点要移动到的位置=父节点中的最大top+父节点的最后一个子节点的高度+20
        }
        else{//如果删除block后父节点没有子节点
            minMove=parentMaxTop+parseFloat($("#"+nodeParentId).css("height"))+20;//父节点的兄弟节点要移动到的位置=父节点中的最大top+父节点的高度+20
        }


        if(nodeParentIdParentIdSubIdsCount==1){//如果父元素无兄弟节点
            newNodeParentIdParentIdTop=parentIdTop;//要删除的block的父节点的父节点的新的top=当前父元素的top
        }
        else{//如果父元素有兄弟节点
            for(value in nodeParentIdParentIdSubIds){//nodeParentId：当前父元素在所有“父节点的父节点的子节点”中的位置
                if(nodeParentIdParentIdSubIds[value]==nodeParentId){parentIndex=parseFloat(value);}
            }
            if(parentIndex<nodeParentIdParentIdSubIdsCount){
                removeBrotherNode(parentIndex,nodeParentIdParentIdSubIds,nodeParentIdParentIdSubIdsCount,minMove);//调整父节点的兄弟节点位置
            }

            parentIdParentIdFirstSubId=nodeParentIdParentIdSubIds[1];
            parentIdParentIdLastSubId=nodeParentIdParentIdSubIds[nodeParentIdParentIdSubIdsCount];

            parentIdParentIdFirstSubIdTop=parseFloat($("#"+parentIdParentIdFirstSubId).css("top"));
            parentIdParentIdLastSubIdTop=parseFloat(decisionTree[parentIdParentIdLastSubId]["css"]["top"]);
            newNodeParentIdParentIdTop=(parentIdParentIdLastSubIdTop-parentIdParentIdFirstSubIdTop)/2+parentIdParentIdFirstSubIdTop;//调整父节点的父节点的位置
        }


        $("#"+nodeParentIdParentId).css("top",newNodeParentIdParentIdTop);
        decisionTree[nodeParentIdParentId]["css"]["top"]=newNodeParentIdParentIdTop+"px";
        instance.repaintEverything();//重绘

        removeParentBrother(nodeParentIdParentId,nodeParentIdParentIdSubIds,nodeParentIdParentIdSubIdsCount);//向上递归调整父节点的父节点/父节点的父节点的兄弟节点/父节点的父节点的父节点的位置

    }

};
/*作用：（删除时）block的定位
node：当前要删除的block*/
var removeNode=function(node){
    if(confirm("确定删除该节点吗?")){
        var nodeId=node.attr("id");//要删除的blockId

        var nodeSubIds=decisionTree[nodeId]["subIds"];//要删除的block的子节点
        var nodeSubIdsCount=nodeSubIds["count"];

        var nodeParentId=decisionTree[nodeId]["data"]["data-parentId"];//要删除的block的父节点
        var nodeParentSubIds=decisionTree[nodeParentId]["subIds"];
        var nodeParentSubIdsCount=nodeParentSubIds["count"];

        var newParentIdTop,//block删除后父节点新的top值
            parentIdFirstSubId,//父节点的第一个子节点
            parentIdFirstSubIdTop,//父节点的第一个子节点的top值
            parentIdLastSubId,//父节点的最后一个子节点
            parentIdLastSubIdTop,//父节点的最后一个子节点的top值
            nodeIndex;//要删除的block在父节点所有子节点中的位置
        for(items in nodeParentSubIds){
            if(nodeParentSubIds[items]==nodeId){nodeIndex=parseFloat(items);}
        }


        var minTop;//要删除的block或其子节点中的最小top值
        //var maxTop;//要删除的block或其子节点中的最大top值
        //var move;//要移动的距离
        if(nodeSubIdsCount) {//如果当前要删除的block有子节点
            subIdsTop=[];
            minTop=subIdMinTop(nodeSubIds,nodeSubIdsCount);
            //maxTop=subIdMaxTop(nodeSubIds,nodeSubIdsCount);
        }
        else{//如果当前要删除的block没有子节点
            minTop=parseFloat(decisionTree[nodeId]["css"]["top"]);
        }

        if(nodeParentSubIdsCount==1){//如果当前要删除的block没有兄弟节点
            newParentIdTop=minTop;//block删除后父节点新的top值=当前要删除的block的top
            delValInArray(nodeParentId,sourceId);//将父节点的id从sourceId（存放有子节点的block的id的数组）移除
        }
        else{//如果当前要删除的block有兄弟节点
            if(nodeIndex==1){//如果当前要删除的block是父节点所有子节点中的第一个
                removeBrotherNode(nodeIndex,nodeParentSubIds,nodeParentSubIdsCount,minTop);
                parentIdFirstSubId=nodeParentSubIds[2];
                parentIdLastSubId=nodeParentSubIds[nodeParentSubIdsCount];
            }
            else if(nodeIndex>1&&nodeIndex<nodeParentSubIdsCount){//如果当前要删除的block是父节点所有子节点中的中间的一个
                removeBrotherNode(nodeIndex,nodeParentSubIds,nodeParentSubIdsCount,minTop);
                parentIdFirstSubId=nodeParentSubIds[1];
                parentIdLastSubId=nodeParentSubIds[nodeParentSubIdsCount];
            }
            else if(nodeIndex==nodeParentSubIdsCount){//如果当前要删除的block是父节点所有子节点中的最后一个
                parentIdFirstSubId=nodeParentSubIds[1];
                parentIdLastSubId=nodeParentSubIds[nodeParentSubIdsCount-1];
            }
            parentIdFirstSubIdTop=parseFloat($("#"+parentIdFirstSubId).css("top"));
            parentIdLastSubIdTop=parseFloat(decisionTree[parentIdLastSubId]["css"]["top"]);
            newParentIdTop=(parentIdLastSubIdTop-parentIdFirstSubIdTop)/2+parentIdFirstSubIdTop;
        }


        if(nodeSubIdsCount){delSubNode(nodeSubIds,nodeSubIdsCount);}//做要删除的block中存在子节点===》删除所有子节点

        $("#"+nodeParentId).css("top",newParentIdTop);//父节点的top位置
        decisionTree[nodeParentId]["css"]["top"]=newParentIdTop+"px";



        delete decisionTree[nodeId];//删除决策树中该block的所有数据
        instance.removeAllEndpoints(node);//删除该block的所有连接
        node.remove();//从dom树中移除该block
        instance.repaintEverything();//重绘
        delete decisionTree[nodeParentId]["subIds"][nodeIndex];//从父节点的subIds数据中移除该block
        if(nodeIndex<nodeParentSubIdsCount){//如果该block后还有兄弟节点，删除该block后兄弟节点的位置向前移
            for(var j=nodeIndex+1;j<=nodeParentSubIdsCount;j++){
                nodeParentSubIds[j-1]=nodeParentSubIds[j];
                delete nodeParentSubIds[j];
            }
        }
        nodeParentSubIdsCount--;//父节点的子节点数量减一
        nodeParentSubIds["count"]=nodeParentSubIdsCount;

        removeParentBrother(nodeParentId,nodeParentSubIds,nodeParentSubIdsCount);

    }
};


/*作用："请选择动作类型"中删除
 $("#treeContainer")：盛放决策树的容器
 ".delNode":用于删除node的img*/
$("#treeContainer").on("click",".delNode",function(e){
    var node=$(e.target).parent();
    removeNode(node);
});
/*作用：保存json数据*/
var exportJson=function(json){
    var jsonExport=JSON.stringify(json);
    return jsonExport;
};
$("#saveBtn").on("click",function(){
    var jsonExport=exportJson(decisionTree);
    console.log(jsonExport);
});
