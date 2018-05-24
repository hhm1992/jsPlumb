//flowRelation:所有流程图关系的id
var flowRelation={};
//allFlowChart:所有流程图的id和对应Json数据
var allFlowChart={};
allFlowChart["newFlowDefault"]='{"connections":[],"blocks":[]}';//初始化当前（"新流程图"）流程图的状态
//stateId:状态模式，初始化状态为拖拽模式
var stateId="dragBtn";
//saveNodePropBtn:元素属性之保存按钮
var saveNodePropBtn=$("#saveNodePropBtn");
//初始化元素属性保存按钮不可用
saveNodePropBtn.prop("disabled",true);
var n=0,//自定义流程图id
    m=0,//创建新的typeBlock的id
    allFlowName=[],//保存所有流程图名称的数组
    Title,//元素属性中title
    Width,//元素属性中width
    Height,//元素属性中height
    Text,//元素属性中text
    Label,//连线时的label
    target,//点击事件下对应的元素target
    exportJson,//导出json格式的数据exportJson
    parentBlockId,//作为父的block的id
    $flowContainer=$("#flowContainer"),//$flowContainer:流程图的容器
    $selectFlowTitle=$("#selectFlowTitle"),//$selectFlowTitle:select元素,保存所有流程图的名称
    instance,//instance:创建一个jsPlumb的实例(流程图)
    thumbnailInstance,//thumbnailInstance:创建一个jsPlumb的实例(缩略图)
    blockType,//当前blackType的类型
    typeIsSource=$("#typeIsSource"),//类型是否为源的input
    typeSourceMaxConn=$("#typeSourceMaxConn"),//源可连接数的input
    typeIsTarget=$("#typeIsTarget"),//类型是否为目标的input
    typeTargetMaxConn=$("#typeTargetMaxConn"),//目标可连接数的input
    switchChange=$("#switch"),//右侧侧边栏开关
    thumbnailCon=$("#thumbnailContainer"),//缩略图容器
    thumbnail=$("#thumbnail");//缩略图
    prop=$("#propContainer");//属性容器
//connectorPaintStyle:基本连接线样式
var connectorPaintStyle = {
    stroke: "blue",//线条描边颜色
    strokeWidth: 2//线条描边宽度
};
// connectorHoverStyle:鼠标悬浮在连接线上的样式
var connectorHoverStyle = {
    stroke: "black",//线条描边颜色
    strokeWidth: 3//线条描边宽度
};
//blockTypeJson:存放blackType的信息
var blockTypeJson={
    'start':{'isSource':true,'sourceMaxConn':1,'isTarget':false,'targetMaxConn':0},
    'rule':{'isSource':true,'sourceMaxConn':1,'isTarget':true,'targetMaxConn':2},
    'package':{'isSource':true,'sourceMaxConn':1,'isTarget':true,'targetMaxConn':2},
    'action':{'isSource':true,'sourceMaxConn':1,'isTarget':true,'targetMaxConn':2},
    'script':{'isSource':true,'sourceMaxConn':1,'isTarget':true,'targetMaxConn':2},
    'decision':{'isSource':true,'sourceMaxConn':2,'isTarget':true,'targetMaxConn':2},
    'fork':{'isSource':true,'sourceMaxConn':2,'isTarget':true,'targetMaxConn':2},
    'join':{'isSource':true,'sourceMaxConn':2,'isTarget':true,'targetMaxConn':2}
};
var x=0,//subIds初始化个数
    y=0,//parentIds初始化个数
    thumbNodeTop=[],//存放缩略图中所有block的top
    thumbNodeLeft=[];//存放缩略图中所有block的left
jsPlumb.ready(function () {
    //instance:创建一个jsPlumb的实例
    instance=jsPlumb.getInstance({
        endpoint: "Blank",//端点无
        anchor:"AutoDefault",//锚点样式为自动锚点
        isTarget: true, //是否可以放置（连线终点）
        isSource: true, //是否可以拖动（作为连线起点）
        Connector: ["Straight",{gap:10}], //连接线的样式种类有[Bezier],[Flowchart],[StateMachine ],[Straight]
        maxConnections:1, // 设置连接点最多可以连接几条线
        Container:"flowContainer"//容器
    });
    thumbnailInstance=jsPlumb.getInstance({
        endpoint: "Blank",//端点无
        isTarget: true, //是否可以放置（连线终点）
        isSource: true, //是否可以拖动（作为连线起点）
        Connector: ["StateMachine"], //连接线的样式种类有[Bezier],[Flowchart],[StateMachine],[Straight]
        maxConnections:-1, // 设置连接点最多可以连接几条线
        Container:"thumbnail"//容器
    });
    //clearAll():清空所有数据
    function clearAll(){
        $('.blockType').each(function(){
            instance.remove(this);
        });
    }
//        var init=function(connection,str){//设置Label
//            console.log(connection.getOverlay("myLabel"));
//            connection.getOverlay("myLabel").setLabel(str);
//        };

    instance.bind("connection",function(info){
        var connection=info.connection;//连线
        var sourceId=info.sourceId;//起点id
        var targetId=info.targetId;//终点id
        console.log("sourceId:"+sourceId,"targetId:"+targetId);
        instance.getConnections().forEach(function(n,i){//流程图防止回环连接
            if(n.sourceId==targetId && n.targetId==sourceId){instance.deleteConnection(connection);}
            else if(sourceId==targetId){instance.deleteConnection(connection);}
            //连线时补充缩略图数据结构
            for(items in thumbnailTree){
                if(thumbnailTree[items]["blockId"]==sourceId){
                    if(!thumbnailTree[items]["subIds"]["count"]){x=0;}
                    else{x=thumbnailTree[items]["subIds"]["count"];}
                    x++;
                    if(thumbnailTree[items]["subIds"][x-1]=="thumb_"+targetId){break;}
                    else{
                        if(sourceId!==targetId){
                            thumbnailTree[items]["data"]["isSource"]=true;
                            thumbnailTree[items]["subIds"]["count"]=x;
                            thumbnailTree[items]["subIds"][x]="thumb_"+targetId;
                        }
                        else{x--;}
                        thumbnailNewNode(sourceId,targetId);//缩略图中添加新元素并定位
                    }
                }
                else if(thumbnailTree[items]["blockId"]==targetId){
                    if(!thumbnailTree[items]["parentIds"]["count"]){y=0;}
                    else{y=thumbnailTree[items]["parentIds"]["count"];}
                    y++;
                    if(thumbnailTree[items]["parentIds"][y-1]=="thumb_"+sourceId){break;}
                    else{
                        thumbnailTree[items]["data"]["isTarget"]=true;
                        thumbnailTree[items]["data"]["data-blocktype"]=$("#"+targetId).attr("data-blocktype");
                        thumbnailTree[items]["parentIds"]["count"]=y;
                        thumbnailTree[items]["parentIds"][y]="thumb_"+sourceId;
                    }
                }
            }
        });
    });
    //initNode():新元素初始样式
    var initNode=function(el){
        instance.draggable(el,{containment:true});//在容器内可拖拽
		var targetType=el.dataset.blocktype;
		if(blockTypeJson[targetType]["isSource"]){
			instance.makeSource(el,{//起点样式
				endpoint: "Blank",//端点无
				anchor:"AutoDefault",//锚点样式为自动锚点
				connectorStyle: connectorPaintStyle,//连接线的颜色，大小样式
				connectorHoverStyle: connectorHoverStyle,//鼠标悬浮在连接线上的样式
				connectorOverlays: [
					["Arrow",{width:10,height:30,location:0.5}],
					["Label",{location:30,id:"myLabel"}]
				],
				maxConnections:blockTypeJson[targetType]['sourceMaxConn'],//源对象最大连接数
                onMaxConnections:function(params, originalEvent) {
                    alert("当前节点出线超出限制，最多出线"+blockTypeJson[targetType]['sourceMaxConn']+"条");
                }
			});
		}
		else{
			instance.setSourceEnabled(el,false);
		}//元素不做起点
		if(blockTypeJson[targetType]["isTarget"]){
			instance.makeTarget(el,{//终点样式
				endpoint: "Blank",//端点无
				anchor:"AutoDefault",//锚点样式为自动锚点
				DragOptions: { cursor: 'pointer', zIndex: 2000 },
				maxConnections:blockTypeJson[targetType]['targetMaxConn'],//目标对象最大连接数
                onMaxConnections:function(params, originalEvent) {
                    alert("当前节点进线超出限制，最多进线"+blockTypeJson[targetType]['targetMaxConn']+"条");
                }
			});
		}
		else{
			instance.setTargetEnabled(el,false);
		}
    };
    //删除连线
    instance.bind("click", function (c) {instance.deleteConnection(c);});

    //exportFlow():将流程图信息导出并保存为json
    function exportFlow(){
        var connections=[],//connections:所有连接线信息
            blocks=[];//blocks:所有元素信息
        $.each(instance.getConnections(),function(i,p){
            connections.push({
                connectionId: p.id,//connectionId:连接线id
                sourceId: p.sourceId,//sourceId:起点id
                targetId: p.targetId//targetId:终点id
            });
        });
        $.each($(".blockType"),function(i,p){
            var $p=$(p);
            blocks.push({
                blockId: $p.attr("id"),//blockId:元素id
                type:$p.attr("data-blocktype"),
                css:{
                    "top": $p.css("top"),//blockTop:元素绝对定位top
                    "left": $p.css("left")//blockLeft:元素绝对定位left
                },
                data:{
                    blockTitle:$p.attr("title"),//blockTitle:元素的title
                    blockWidth:$p.css("width"),//blockWidth:元素的width
                    blockHeight: $p.css("height"),//blockHeight:元素的height
                    blockHtml: $p.html()//blockHtml:元素的html
                }
            });
        });
        //jsonExport:将流程图信息以json格式输出
        var jsonExport="{"+'"connections":'+JSON.stringify(connections)+","+'"blocks":'+JSON.stringify(blocks)+"}";
        return jsonExport;
    }
    //importFlow(data):将json导入生成流程图
    function importFlow(data){
        clearAll();//清空当前流程图容器中所有数据
        var jsonImport=JSON.parse(data);//出入的json数据转换为js对象
        $.each(jsonImport["blocks"],function(i,p){
            let newHtml = '<div id="'+p.blockId+'" class="blockType">'+p.data.blockHtml+'</div>';
            $("#flowContainer").append(newHtml);
            let newDiv = $('#'+ p.blockId);
            newDiv.css(p.css);
            newDiv.css({
                width: p.data.blockWidth,
                height: p.data.blockHeight
            });
            newDiv.data("blocktype", p.type);
            newDiv.attr("data-blocktype", p.type);
            newDiv.attr("title", p.data.blockTitle);
            initNode(newDiv.get(0));
        });
        $.each(jsonImport["connections"],function(i,p){
            var imSourceId=p.sourceId;
            var imTargetId=p.targetId;
            instance.connect({
                source:imSourceId,
                target:imTargetId,
                anchor:"AutoDefault",
                overlays: [
                    ["Arrow",{width:10,height:30,location:0.5}]
                ]
            },connectorPaintStyle);
        });
    }


    //导出
    $("#exBtn").click(function(){exportJson=exportFlow();});
    //导入
    $("#imBtn").click(function(){$("#importModel").show();$("#jsonContainer").val(exportJson);});
    //导入模态框“importJsonBtn”按钮点击事件
    $("#importJsonBtn").click(function(){
        var eJson=$("#jsonContainer").val();
        importFlow(eJson);
        //importFlow(exportJson);
        $("#importModel").hide();
    });
    $("#cancelImportBtn").click(function(){$("#importModel").hide();});


    //流程图嵌套
    //$("#newFlowContainer").children().attr("id")==>$selectFlowTitle.children().attr("flowOption")==>$("img").attr("data-nodeid")
    //saveCurrentFlow():保存当前流程图
    var saveCurrentFlow=function(){
        exportJson=exportFlow();//导出当前流程图数据
        $("#currentFlowModel").show();//保存当前流程图的模态框显示
    };
    //saveCurrentJson():保存当前流程图的json数据
    var flowName=$selectFlowTitle.children();
    $.each(flowName,function(i,p){
        allFlowName.push(p.innerHTML);
    });
    var saveCurrentJson=function(){//保存当前流程图的模态框中“currentFlowNameOk”按钮点击事件
        var modelName=$("#currentFlowChartName").val().trim();//modelName:给当前流程图命名
        if(modelName){
            if(allFlowName.indexOf(modelName)==-1){
                allFlowName.push(modelName);
                var flowOptionId="flow_fl_"+$("#selectFlowTitle").children().size();//自动生成option的id
                $selectFlowTitle.append('<option id="'+flowOptionId+'">'+modelName+'</option>');//将当前流程图的名称追加到select中
                $("#"+flowOptionId).prop("selected",true);//select中对应当前流程图名称的option为选中状态
                var optionFlowId=$("#newFlowContainer").children(".active").attr("id");//获取当前tab的id
                $("#"+flowOptionId).attr("flowOption",optionFlowId);//将select中对应的option的flowOption属性设置为tab的id
                $('#'+optionFlowId).html(modelName+"<i>x</i>");//当前tab的html和设置的流程图名字保持一致
                $("#flowTitle").val($selectFlowTitle.children(":selected").html());//流程图属性中flowTitle的值为当前流程图的名称
                allFlowChart[$("#"+flowOptionId).attr("flowOption")]=exportJson;//将当前流程图的id和对应json数据保存到allFlowChart对象中
                $("#currentFlowModel").hide();//保存当前流程图的模态框隐藏
            }
            else{alert("该流程图名字已存在，请重新命名");}
        }
        else{alert("模块名不能为空")}
    };
    //closeAndSaveCurrentJson();关闭并保存当前流程图的json数据
    var closeAndSaveCurrentJson=function(){
        closeFlowYes=false;//closeFlowYes:关闭流程图对应的Yes按钮状态为false
        var modelName=$("#currentFlowChartName").val().trim();//modelName:给当前流程图命名
        if(modelName){
            if(allFlowName.indexOf(modelName)!==-1) {alert("该流程图名字已存在，请重新命名");}
            else{
                allFlowName.push(modelName);
                var flowOptionId = "flow_fl_" + $("#selectFlowTitle").children().size();//自动生成option的id
                $selectFlowTitle.append('<option id="' + flowOptionId + '">' + modelName + '</option>');//将当前流程图的名称追加到select中
                var optionFlowId = $("#newFlowContainer").children(".active").attr("id");//获取当前tab的id
                $("#" + flowOptionId).attr("flowOption", optionFlowId);//将select中对应的option的flowOption属性设置为tab的id
                allFlowChart[$("#" + flowOptionId).attr("flowOption")] = exportJson;//将当前流程图的id和对应json数据保存到allFlowChart对象中
                $("#currentFlowModel").hide();//保存当前流程图的模态框隐藏
                closeFlowChart();//关闭流程图函数
            }
        }
        else{alert("模块名不能为空")}
    };
    //给当前流程图命名No按钮点击事件
    $("#currentFlowNameNo").click(function(){$("#currentFlowModel").hide();});//保存当前流程图的模态框隐藏
    //给当前流程图命名Ok按钮点击事件
    $("#currentFlowNameOk").click(function(){
        if(!closeFlowYes){saveCurrentJson();}//如果closeFlowYes=false,调用saveCurrentJson()
        else{closeAndSaveCurrentJson();}//如果closeFlowYes=true,调用closeAndSaveCurrentJson();

    });
    //保存当前流程图按钮点击事件
    $("#saveCurrentFlow").click(function(){
        var tabFlowId=$("#newFlowContainer").children(".active").attr("id");//当前流程图的id
        var currentFlowJson=exportFlow();//将当前流程图数据导出
        //如果当前流程图未保存,则先保存
        if($selectFlowTitle.children('[flowOption='+tabFlowId+']').attr("id")==undefined){saveCurrentFlow();}
        else if(currentFlowJson!=allFlowChart[tabFlowId]){//如果当前流程图已保存但数据发生变化,则更新数据
            if(confirm("您已修改该流程图，要保存更改吗？")) {
                allFlowChart[tabFlowId] = currentFlowJson;
            }
        }
    });

    //select选中项改变事件
    $selectFlowTitle.change(function(e){
        var $target=$(e.target);//select
        var targetId=$target.children(":selected").attr("id");//当前选中项的id
        var targetFlowId=$("#"+targetId).attr("flowOption");//当前选中项的flowOption属性
        $("#flowTitle").val($("#"+targetId).html());//流程图属性中flowTitle的值为当前流程图的名称
		$("#newFlowContainer").children().removeClass("active");
        if(targetId=="newFlowDefault"){//如果当前选中项的是默认"新流程图"==》在tab中新添加一个空的"新流程图"页面
            n++;
            clearAll();//清空页面
            $("#newFlowContainer").append('<div class="newFlow active" id="newFlow'+n+'">新流程图<i>x</i></div>');//添加一个新的tab子项
            importFlow(allFlowChart["newFlowDefault"]);
        }
        else if($("#newFlowContainer").children("#"+targetFlowId).attr("id")==undefined){//如果当前选中项在tab中不存在==》在tab中新添加当前选中项的页面
            $("#newFlowContainer").append('<div class="newFlow active" id="'+targetFlowId+'">'+$("#"+targetId).html()+'<i>x</i></div>');
            importFlow(allFlowChart[targetFlowId]);//导入
        }
        else{//如果当前选中项在tab中已存在==》在tab中切换显示的页面
            $("#"+targetFlowId).addClass("active");
            importFlow(allFlowChart[targetFlowId]);//导入
        }
        stateId="dragBtn";//拖拽状态
        state($('.blockType'));
    });

    //鼠标右键创建子流程图
    $flowContainer.on("contextmenu",'.blockType',function(e){//自定义右键菜单显示
        parentBlockId=$(e.target).parent().attr("id")||$(e.target).attr("data-blockid");//有子流程图的block的id
        var x= e.clientX;
        var y= e.clientY;
        $("#contextMenu").css({display:"block",top:y,left:x});
        return false;//阻止系统默认右键菜单显示
    });
    $("body").on("click",function(){
        $("#contextMenu").css("display","none");//自定义右键菜单隐藏
    });
    $("#contextMenu").on("click","li",function(e){//自定义右键菜单选中项事件
        $("#contextMenu").css("display","none");
        if(e.target.className=="create"){//自定义右键菜单选中项为"创建子流程图"
            allBlockType=[];
            n++;
            subFlowId="newFlow"+n;//子流程图的Id
            $("#"+parentBlockId).children("span").append('<img src="images/down.png" data-blockid="'+parentBlockId+'" data-nodeid="'+subFlowId+'">');//每个右键创建子流程图的block中加一个图标
            $("#thumb_"+parentBlockId).children("span").append('<img src="images/down.png" data-blockid="'+parentBlockId+'" data-nodeid="'+subFlowId+'">');
            var currentFlowId=$("#newFlowContainer").children(".active").attr("id");//当前tab的id
            allFlowChart[currentFlowId]=exportFlow();//将当前tab的id和当前的流程图导出保存在allFlowChart中
            flowRelation[parentBlockId]={
                "currentFlowId":currentFlowId,//有子流程图的block所在流程图的id
                "subFlowId":subFlowId//有子流程图的block对应子流程图的id
            };

            /*$('.blockType').each(function(){
                if(this.id!=parentBlockId){
                    instance.remove(this);
                }
                else{
                    $(this).children("span").children("img").attr({"src":"images/up.png","data-nodeid":currentFlowId});
                }
            });*/

            clearAll();//清空页面
            stateId="dragBtn";//拖拽状态
            state($('.blockType'));
            $("#newFlowContainer").children().removeClass("active");
            $("#newFlowContainer").append('<div class="newFlow active" id="newFlow'+n+'" data-node="'+parentBlockId+'">新流程图<i>x</i></div>');//添加一个新的tab子项
            $selectFlowTitle.children("#newFlowDefault").prop("selected",true);
            $("#flowTitle").val($selectFlowTitle.children(":selected").html());//流程图属性中flowTitle的值为当前流程图的名称
        }
        else if(e.target.className=="property"){//自定义右键菜单选中项为"属性"
            $("#aside").show();
            $("#prop").addClass("active").siblings().removeClass("active");
            thumbnailCon.css("display","none");
            prop.css("display","block");
            switchChange.css("backgroundPosition","-30px 0");
            $("#flowTitle").val($selectFlowTitle.children(":selected").html());//流程图名称input中显示的是当前流程图的名称
        }
        else if(e.target.className=="deleteSubFlow"){//自定义右键菜单选中项为"删除子流程图"
            if(flowRelation[parentBlockId]["subFlowId"]!==""){//如果要删除子流程图的block有子流程图
                if(confirm("您确定要删除该模块下的子流程图吗？")){
                    var subFlowId=flowRelation[parentBlockId]["subFlowId"];//子流程图的id
//                       $.each(JSON.parse(allFlowChart[subFlowId])["blocks"],function(i,p){//将子流程图中的每个block删除
//                           delete flowRelation[p.blockId];
//                       });
                    //delete allFlowChart[subFlowId];//从allFlowChart中删除子流程对应的json数据
                    $("#newFlowContainer").children("#"+subFlowId).remove();//从tab中移除子流程图对应的tab子项
                    $selectFlowTitle.children('[flowOption='+subFlowId+']').remove();//从select中移除子流程图对应的option
                    flowRelation[parentBlockId]["subFlowId"]="";//将parentBlockId对应的子流程图名称设为""
                    $("#"+parentBlockId).children("img").remove();//将parentBlockId的子流程图图标删除
                }
            }
            else{alert("该模块没有子流程图");}
        }
        else if(e.target.className=="deleteBlock"){//自定义右键菜单选中项为"删除该节点"
            if(confirm("确定删除该节点吗?")){
                var index,//要删除的节点在父节点或子节点中的位置
                    count,//父节点或子节点的总个数
                    idsIds;//所有父节点或子节点
                if(thumbnailTree["thumb_"+parentBlockId]["data"]["isSource"]){//如果要删除的节点可作为源节点
                    var subIds=thumbnailTree["thumb_"+parentBlockId]["subIds"];//subIds==》要删除节点下的所有子节点
                    var subIdsCount=subIds["count"];
                    if(subIdsCount){//如果存在子节点==》删除全部子节点
                        for(var i=1;i<=subIdsCount;i++){
                            idsIds=subIds[i];
                            console.log("idsIds:"+idsIds);
                            delete thumbnailTree[idsIds];//删除缩略图中子节点数据
                            thumbnailInstance.removeAllEndpoints(idsIds);//缩略图中删除所有子节点
                            $("#"+idsIds).remove();
                            var idsNodeIds=idsIds.slice(idsIds.indexOf("_")+1);//流程图中删除所有子节点
                            $("#"+idsNodeIds).remove();
                        }
                    }
                }
                if(thumbnailTree["thumb_"+parentBlockId]["data"]["isTarget"]){//如果要删除的节点可作为目标节点
                    var parentIds=thumbnailTree["thumb_"+parentBlockId]["parentIds"];//parentIds==》要删除节点下的所有父节点
                    //遍历所有父节点==》更改所有父节点的子节点数据==》//如果下面有兄弟节点，调整下面的兄弟节点/父节点/祖先节点的位置
                    for(var j=1;j<=parentIds["count"];j++){
                        idsIds=thumbnailTree[parentIds[j]]["subIds"];
                        console.log("parentIds[j]:"+parentIds[j]);
                        count=idsIds["count"];
                        var parentParentIds=thumbnailTree[parentIds[j]]["parentIds"];
                        var parentParentIdsCount=parentParentIds["count"];
                        var parentParentId=parentParentIds[1];
                        var parentParentIdSubIds=thumbnailTree[parentParentId]["subIds"];
                        var parentParentIdSubIdsCount=parentParentIdSubIds["count"];
                        console.log(parentParentIdSubIds);
                        console.log("parentParentIdSubIdsCount:"+parentParentIdSubIdsCount);
                        var parentIndex;//父节点的祖先节点所有子节点中的位置
                        var prevSiblingId;//上一个兄弟节点的id
                        if(count==1){thumbnailTree[parentIds[j]]["data"]["isSource"]=false;}
                        if(parentParentIdsCount){
                            for(key in parentParentIdSubIds){
                                if(parentParentIdSubIds[key]==parentIds[j]){parentIndex=parseInt(key);console.log("parentIndex:"+parentIndex)}
                            }
                        }
                        for(items in idsIds){
                            if(idsIds[items]=="thumb_"+parentBlockId){index=parseInt(items);console.log("index:"+index);}
                        }

                        if(index<count){//如果下面有兄弟节点，调整下面的兄弟节点的位置
                            var nextId=idsIds[index+1];//要删除的节点下面的第一个节点
                            var nextMinTop=nextSiblingMinTop(nextId);
                            var moveToTop;//要删除的节点下面的节点要移动到的top=要删除的节点上面一个节点的最大top+55
                            if(index==1){//如果要删除的节点是第一个子节点
                                if(parentIndex==1){moveToTop=5;}
                                else{
                                    prevSiblingId=parentParentIdSubIds[parentIndex-1];
                                    moveToTop=prevSiblingMaxTop(prevSiblingId)+55;
                                }
                            }
                            else{//如果要删除的节点是中间位置子节点
                                prevSiblingId=idsIds[index-1];
                                moveToTop=prevSiblingMaxTop(prevSiblingId)+55;
                            }
                            console.log("moveToTop:"+moveToTop);
                            var  moveTop=-(nextMinTop-moveToTop);//要删除的节点下面的兄弟节点移动的top距离
                            for(var k=index+1;k<=count;k++){//遍历兄弟节点
                                if(idsIds[k]){//如果下面的兄弟节点存在
                                    console.log(idsIds[k]);
                                    var brotherId=idsIds[k];
                                    var brotherSubIds=thumbnailTree[brotherId]["subIds"];
                                    var brotherSubIdsCount=brotherSubIds["count"];
                                    if(!brotherSubIdsCount){//如果下面的兄弟节点没有子节点
                                        thumbNodeNewTop(brotherId,moveTop);
                                    }
                                    else{//如果下面的兄弟节点存在子节点
                                        thumbNodeNewTop(brotherId,moveTop);
                                        thumbSubIdTop(brotherSubIdsCount,brotherSubIds,moveTop);
                                    }
                                }
                            }

                            /*
                            if(ptParentIdsCount){
                                resetParentBrotherTop(sourcePtId,subIdsCount,55);
                            }

                             var resetParentBrotherTop=function(sourceParentId,subIdsCount,moveTop){
                             var parentParentId=thumbnailTree[sourceParentId]["parentIds"][1];
                             var parentParentSubIds=thumbnailTree[parentParentId]["subIds"];
                             var parentParentSubIdsCount=parentParentSubIds["count"];
                             if(subIdsCount>=2){//调整父节点的兄弟节点的top
                                 if(parentParentSubIdsCount>=2){
                                    resetBrotherIdTop(sourceParentId,parentParentSubIds,parentParentSubIdsCount,moveTop);
                                 }
                             }
                             var parentParentIdParentIdsCount=thumbnailTree[parentParentId]["parentIds"]["count"];
                                 if(parentParentIdParentIdsCount){
                                    resetParentBrotherTop(parentParentId,subIdsCount,moveTop);
                                 }
                             };
                            */
                        }
                        //调整父节点兄弟节点的top
                        console.log(parentIndex<parentParentIdSubIdsCount);
                        if(parentIndex<parentParentIdSubIdsCount){
                            var parentNextSibId=parentParentIdSubIds[parentIndex+1];
                            console.log("parentNextSibId:"+parentNextSibId);
                            var parentNextTop=nextSiblingMinTop(parentNextSibId);
                            console.log("parentNextTop:"+parentNextTop);
                            console.log(idsIds);
                            console.log(count);
                            var nodeMinTop=subIdMinTop(idsIds,count);
                            console.log("nodeMinTop:"+nodeMinTop);
                        }
                        delete idsIds[index];
                        if(index<count){removeIndex(index,count,idsIds);}
                        count--;
                        idsIds["count"]=count;
                        resetParentIdTop(parentIds[j],1,count);//调整父节点/祖先节点的位置
                    }


                }
                instance.removeAllEndpoints(parentBlockId);
                $("#"+parentBlockId).remove();
                delete thumbnailTree["thumb_"+parentBlockId];//删除缩略图中节点数据
                thumbnailInstance.removeAllEndpoints("thumb_"+parentBlockId);//缩略图中删除节点
                $("#thumb_"+parentBlockId).remove();
                thumbnailInstance.repaintEverything();
            }
        }
    });

    //属性侧边栏打开和关闭
    switchChange.click(function(){
        $("#aside").toggle();
        if($("#thumb").hasClass("active")){
            thumbnailCon.css("display","block");
            prop.css("display","none");
        }
        else if($("#prop").hasClass("active")){
            thumbnailCon.css("display","none");
            prop.css("display","block");
        }
        if($("#aside").css("display")=="block"){
            switchChange.css("backgroundPosition","-30px 0");
        }
        else{
            switchChange.css("backgroundPosition","-20px 0");
            thumbnailCon.css("display","none");
            prop.css("display","none");
        }
    });
    //流程图属性保存按钮单击事件
    $("#saveFlowPropBtn").click(function(){
        var flowTitle=$("#flowTitle").val().trim();//流程图名称input的内容
        var optionFlowId=$("#newFlowContainer").children(".active").attr("id");//当前显示的tab的id
        if($selectFlowTitle.children(":selected").html()!="新流程图"){//如果当前流程图的名称不是"新流程图"===》修改流程图名称
            $selectFlowTitle.children(":selected").html(flowTitle);//修改流程图名称
        }
        else{//如果当前流程图的名称是"新流程图"===》修改流程图名称并追加一个option保存到select中
            if(allFlowName.indexOf(flowTitle)==-1) {
                allFlowName.push(flowTitle);
                var flowOptionId = "flow_fl_" + $("#selectFlowTitle").children().size();//自动生成option的id
                $selectFlowTitle.append('<option id="' + flowOptionId + '">' + flowTitle + '</option>');//将当前流程图的名称追加到select中
                $("#" + flowOptionId).prop("selected", true);//select中对应当前流程图名称的option为选中状态
                $("#" + flowOptionId).attr("flowOption", optionFlowId);
            }
            else{alert("该流程图名字已存在，请重新命名");}
        }
        $('#'+optionFlowId).html(flowTitle+"<i>x</i>");//当前显示的tab的html为设置的流程图名称
    });
    $("#flowContainer").on("click",".blockType",function(e){//点击元素获得属性显示在表单上
        if(stateId=="clickBtn"){
            $("#blockProp").css("display","block");
            target=$(e.target).parent();//target:当前选中的元素
            Title=target.attr("title");//Title:当前选中的元素的title
            Width=target.css("width");//Width:当前选中的元素的width
            Height=target.css("height");//Height:当前选中的元素的height
            Text=target.children("span").text();//Text:当前选中的元素的text
            $("#titleInp").val(Title);//$("#titleInp"):当前选中的元素title属性输入显示框
            $("#widthInp").val(Width);//$("#widthInp"):当前选中的元素width属性输入显示框
            $("#heightInp").val(Height);//$("#heightInp"):当前选中的元素height属性输入显示框
            $("#textInp").val(Text);//$("#textInp"):当前选中的元素text属性输入显示框
        }
    });


    //容器中各元素双击事件(进入对应子流程图)
    $flowContainer.on("dblclick","span img",function(e){
        var $target=$(e.target);//$target:双击的元素
        var nodeId=$target.attr("data-nodeid");//nodeId:双击的元素的属性data-nodeid
        allFlowChart[$("#newFlowContainer").children(".active").attr("id")]=exportFlow();//导出当前class属性为active的tab对应的流程图到其id下
        var flowOptionSelected=$selectFlowTitle.children('[flowOption='+nodeId+']');//select中属性flowOption=nodeId的子元素
        if(flowOptionSelected.html()){//如果select中属性flowOption=nodeId的子元素存在（即已保存）==》切换到对应流程图
            flowOptionSelected.prop("selected",true);//select中对应的流程图名称的option为选中状态
            if($("#newFlowContainer").children("#"+nodeId).attr("id")==undefined){//如果tab中不存在切换的流程图==》在tab中追加切换的流程图
                $("#newFlowContainer").append('<div class="newFlow" id="'+nodeId+'">'+flowOptionSelected.html()+'<i>x</i></div>');
            }
        }
        else{//如果select中属性flowOption=nodeId的子元素不存在（即未保存）==》在tab中追加切换的一个"新流程图",id为要切换的流程图的id
            $("#newFlowDefault").prop("selected",true);//select中对应的流程图名称的option为选中状态
			if($("#newFlowContainer").children("#"+nodeId).attr("id")==undefined){
                $("#newFlowContainer").append('<div class="newFlow" id="'+nodeId+'">新流程图<i>x</i></div>');
            }
        }
		$("#flowTitle").val($selectFlowTitle.children(":selected").html());//流程图属性中flowTitle的值为当前流程图的名称
        importFlow(allFlowChart[nodeId]);//导入要切换的流程图的内容
        $("#newFlowContainer").children().removeClass("active");
        $("#newFlowContainer").children('#'+nodeId).addClass("active");
        stateId="dragBtn";//拖拽状态
        state($('.blockType'));
    });

    //$("#newFlowContainer"):存放所有新流程图名称的容器==>做为tab
    var closeFlowId, //要关闭的流程图的id
        closeFlowYes=false;//closeFlowYes:关闭流程图对应的Yes按钮状态为false
    var closeFlowChart=function(){//closeFlowChart():关闭流程图的函数
        var totalFlow=$("#newFlowContainer").children().size();//tab中的子项的个数
        if(totalFlow==1){//如果tab中的只有一个子项==》清空页面,恢复到初始状态
            n++;
            clearAll();//清空页面
            $("#newFlowDefault").prop("selected",true);//select中默认"新流程图"选中
            importFlow(allFlowChart["newFlowDefault"]);
            $("#newFlowContainer").html('<div class="newFlow active" id="newFlow'+n+'">新流程图<i>x</i></div>');
        }
        else if(totalFlow==2){//如果tab中的只有2个子项==》关闭选中的流程图,其兄弟流程图显示
            var targetSiblingId=$("#"+closeFlowId).siblings().attr("id");//选择关闭流程图的兄弟流程图的id
            $("#"+targetSiblingId).addClass("active");
            $('[flowOption='+targetSiblingId+']').prop("selected",true);//select中对应的流程图名称的option为选中状态
            importFlow(allFlowChart[targetSiblingId]);
            $("#"+closeFlowId).remove();//清除选择关闭的流程图
        }
        else if(totalFlow>2){//如果tab中的有3个以上子项==》关闭选中的流程图,其兄弟流程图显示
            var targetNextSiblingId=$("#"+closeFlowId).next().attr("id");//选择关闭流程图的下一个兄弟流程图的id
            var targetPrevSiblingId=$("#"+closeFlowId).prev().attr("id");//选择关闭流程图的上一个兄弟流程图的id
            if(targetNextSiblingId!=undefined){//如果下一个兄弟流程图存在,关闭选中的流程图,下一个兄弟流程图显示
                $("#"+targetNextSiblingId).addClass("active");
                $('[flowOption='+targetNextSiblingId+']').prop("selected",true);//select中对应的流程图名称的option为选中状态
                importFlow(allFlowChart[targetNextSiblingId]);
            }
            else if(targetPrevSiblingId!=undefined){//如果上一个兄弟流程图存在,关闭选中的流程图,上一个兄弟流程图显示
                $("#newFlowContainer").children().removeClass("active");
                $("#"+targetPrevSiblingId).addClass("active");
                $('[flowOption='+targetPrevSiblingId+']').prop("selected",true);//select中对应的流程图名称的option为选中状态
                importFlow(allFlowChart[targetPrevSiblingId]);
            }
            $("#"+closeFlowId).remove();
        }
        $("#flowTitle").val($selectFlowTitle.children(":selected").html());//流程图属性中flowTitle的值为当前流程图的名称
    };
    //$("#newFlowContainer")中的"x"点击事件(关闭流程图事件)
    $("#newFlowContainer").on("click","i",function(e){
        e.stopPropagation();//阻止事件冒泡
        var $target=$(e.target);//当前点击的"x"
        var targetText=$target.parent().text();//当前tab子项的text
        closeFlowId=$target.parent().attr("id");//当前tab子项的id(要关闭的流程图的id)
        var jsonExport=exportFlow();//导出当前流程图
        //如果当前tab子项的text="新流程图"或者导出的json数据和allFlowChart保存的不一致,关闭流程图模态框显示
        if(targetText.slice(0,targetText.indexOf("x"))=="新流程图"){$("#closeFlowModel").show();} //如果当前tab子项的text="新流程图"(即未保存),关闭流程图模态框显示
        else if(jsonExport!=allFlowChart[closeFlowId]){//如果当前流程图已保存但数据发生变化,将变化后的数据保存
            if(confirm("您已修改该流程图，要保存更改吗？")){
                allFlowChart[closeFlowId]=jsonExport;
            }
            closeFlowChart();
        }
        else{closeFlowChart();}//如果已经保存并且流程图无变化,则直接关闭流程图
    });
    $("#closeFlowModel").on("click","button",function(e){//关闭流程图模态框中按钮点击事件
        var $target=$(e.target);
        var targetId=$target.attr("id");
        if(targetId=="closeFlowYes"){//如果点击的按钮为"closeFlowYes"
            closeFlowYes=true;
            var tabFlowId=$("#newFlowContainer").children(".active").attr("id");
            var currentFlowJson=exportFlow();
            if($selectFlowTitle.children('[flowOption='+tabFlowId+']').attr("id")==undefined){saveCurrentFlow();}
            else if(currentFlowJson!=allFlowChart[tabFlowId]){
                if(confirm("您已修改该流程图，要保存更改吗？")) {
                    allFlowChart[tabFlowId] = currentFlowJson;
                }
                closeFlowChart();
            }
        }
        else if(targetId=="closeFlowNo"){//如果点击的按钮为"closeFlowNo"==>直接关闭流程图
            closeFlowChart();
        }
        $("#closeFlowModel").hide();//关闭流程图模态框隐藏
    });
    //tab中各子项之间切换
    $("#newFlowContainer").on("click",".newFlow",function(e){
        var $target=$(e.target);//当前点击tab子项
        var targetId=$target.attr("id");//当前点击tab子项的id
        allFlowChart[$("#newFlowContainer").children(".active").attr("id")]=exportFlow();//导出当前class属性为active的tab对应的流程图到其id下
        if($('[flowOption='+targetId+']').html()==undefined){//如果select中不存在当前tab子项（即未保存）,select中"新流程图"为选中状态
            $("#newFlowDefault").prop("selected",true);
        }
        else{//如果select中存在当前tab子项（即已保存）
            $('[flowOption='+targetId+']').prop("selected",true);//select中对应的流程图名称的option为选中状态
        }
        $target.addClass("active").siblings().removeClass("active");//切换active
        $("#flowTitle").val($selectFlowTitle.children(":selected").html());//流程图属性中flowTitle的值为当前流程图的名称
        var jsonNest=allFlowChart[targetId];//当前点击tab子项id对应的json数据
        if(jsonNest==undefined){importFlow(allFlowChart["newFlowDefault"]);}//如果json不存在,导入初始状态对应的空白流程图
        else{importFlow(jsonNest);}//否则导入流程图
        stateId="dragBtn";//拖拽状态
        state($('.blockType'));
    });

    //可选择的block的点击事件
    var allBlockType=[];//存放页面上放置的所有的type值
    $("#blocks").on("click","img",function(e){
        m++;
        blockType=$(e.target).attr("id");
        $("#"+blockType).addClass("active").siblings().removeClass("active");
        var typeBlock=document.createElement("div");
        typeBlock.id=blockType+m;
        typeBlock.className="blockType";
		typeBlock.dataset.blocktype=blockType;
        typeBlock.innerHTML='<img src="images/'+blockType+'.png"/><span>'+$("#"+blockType).attr("title")+'</span>';
        flowRelation[typeBlock.id]={
            "currentFlowId":$("#newFlowContainer").children(".active").attr("id"),
            "subFlowId":""
        };
        if(blockType=="start"&&allBlockType.indexOf("start")!=-1){alert("当前节点只允许创建一个");}//只允许放一个start类型的元素
        else{
            instance.getContainer().appendChild(typeBlock);
            allBlockType.push(blockType);
        }
        initNode(typeBlock);
        stateId="dragBtn";
        state(typeBlock);
        thumbnailJson(typeBlock);
        var activeFlowId=$("#newFlowContainer").children(".active").attr("id");
        if($('#flowContainer').children().size()==1){
            if(activeFlowId=="newFlow0"){
                var firstChildId=$('#flowContainer').children().attr("id");
                var thumbNode=newThumbNode(firstChildId);
                $(thumbNode).css({"top":"5px","left":"10px"});
                thumbnailTree["thumb_"+firstChildId]["css"]={"top":5,"left":10};
                typeBlock.dataset.blocktype=blockType;
                thumbnailTree["thumb_"+firstChildId]["data"]["data-blocktype"]=blockType;
            }
            else{//添加子流程图时
                var subFlowNodeId = $("#"+activeFlowId).attr("data-node");
                thumbnailTree["thumb_" + subFlowNodeId]["data"]["isSource"]=true;
                var subFlowNodeIdSubIdsCount = thumbnailTree["thumb_" + subFlowNodeId]["subIds"]["count"];
                if (!subFlowNodeIdSubIdsCount){subFlowNodeIdSubIdsCount=0;}
                subFlowNodeIdSubIdsCount++;
                thumbnailTree["thumb_" + subFlowNodeId]["subIds"]["count"] = subFlowNodeIdSubIdsCount;
                thumbnailTree["thumb_" + subFlowNodeId]["subIds"][subFlowNodeIdSubIdsCount] = "thumb_" + typeBlock.id;
                thumbnailTree["thumb_" + typeBlock.id]["data"]["isTarget"] = true;
                thumbnailTree["thumb_" + typeBlock.id]["parentIds"]["count"] = 1;
                thumbnailTree["thumb_" + typeBlock.id]["parentIds"][1] = "thumb_" + subFlowNodeId;
                thumbnailTree["thumb_"+typeBlock.id]["data"]["data-blocktype"]=blockType;
                thumbnailNewNode(subFlowNodeId,typeBlock.id);
            }
        }
        if(activeFlowId=="thumbnailFlow"){
            $(".blockType>img").css("width",20);
            $(".blockType>span").css("font-size",10);
            $(".blockType>span>img").css("width",10);
        }
    });
    //"修改默认配置"按钮点击事件
    $("#modifyConfig").click(function(){
        $("#modifyConfigModel").css("display","block");
    });
    //"类型"select的change事件
    $("#type").change(function(e){
        var selectType=$(e.target).children(":selected").val();
        var selectTypeJson=blockTypeJson[selectType];
        if(selectTypeJson["isSource"]){typeIsSource.children('[value="true"]').prop("selected",true);}
        else{typeIsSource.children('[value="false"]').prop("selected",true);}
        if(selectTypeJson["isTarget"]){typeIsTarget.children('[value="true"]').prop("selected",true);}
        else{typeIsTarget.children('[value="false"]').prop("selected",true);}
        typeSourceMaxConn.val(selectTypeJson["sourceMaxConn"]);
        typeTargetMaxConn.val(selectTypeJson["targetMaxConn"]);
    });
    //默认配置模态框中"确认"和"取消"按钮点击事件
    $("#modifyConfigBtn").on("click","button",function(e){
        var targetId=$(e.target).attr("id");
        var selectType=$("#type").children(":selected").val();
		var targetTypeBlock=$('[data-blocktype='+selectType+']').get(0);
        if(targetId=="modifyConfigOk"){
            if(typeIsSource.children('[value="true"]').prop("selected")){blockTypeJson[selectType]["isSource"]=true;}
            else if(!typeIsSource.children('[value="true"]').prop("selected")){blockTypeJson[selectType]["isSource"]=false;}
            if(typeIsTarget.children('[value="true"]').prop("selected")){blockTypeJson[selectType]["isTarget"]=true;}
            else if(!typeIsTarget.children('[value="true"]').prop("selected")){blockTypeJson[selectType]["isTarget"]=false;}
            blockTypeJson[selectType]["sourceMaxConn"]=typeSourceMaxConn.val().trim();
            blockTypeJson[selectType]["targetMaxConn"]=typeTargetMaxConn.val().trim();
        }
		if(targetTypeBlock!=undefined){initNode(targetTypeBlock);}//重定义元素属性
        $("#modifyConfigModel").css("display","none");
    });


    $('#flowContainer').on('mouseup',".blockType",function(e){//在连线模式下，若该节点不作为"目标"，有弹窗提示"当前节点不允许进线"
        if(stateId=="conBtn"&&e.button!=2){//e.button用于判断是左键还是右键，!2为左键，防止右键自定义菜单与此功能混淆
            var target = e.target;
            var tagName = target.nodeName;
            if(tagName == "IMG" ||tagName == "SPAN"){
                var block;
                if($(target).attr("data-blockid")==undefined){block = $(target).parent('.blockType');}
                else {block=$(target).parent().parent(".blockType");}
                var blockTypeName=block.attr("data-blocktype");
                if(!blockTypeJson[blockTypeName]["isTarget"]){
                    alert("当前节点不允许进线");
                }
            }
        }
    });
    $('#flowContainer').on('mousedown',".blockType",function(e){//在连线模式下，若该节点不作为"源"，有弹窗提示"当前节点不允许出线"
        if(stateId=="conBtn"&&e.button!=2){//e.button用于判断是左键还是右键，!2为左键，防止右键自定义菜单与此功能混淆
            var target= e.target;
            var tagName=target.nodeName;
            if(tagName=="IMG"||tagName=="SPAN"){
                var block=$(target).parent(".blockType");
                var blockTypeName=block.attr("data-blocktype");
                if(!blockTypeJson[blockTypeName]["isSource"]){
                    alert("当前节点不允许出线");
                }
            }
        }
    });





    //属性和缩略图切换显示
    $("#aside").on("click","div",function(e){
        var target=$(e.target);
        var targetId=target.attr("id");
        target.addClass("active").siblings().removeClass("active");
        if(targetId=="thumb"){
            thumbnailCon.css("display","block");
            prop.css("display","none");
        }
        else if(targetId=="prop"){
            prop.css("display","block");
            thumbnailCon.css("display","none");
        }
    });
    //thumbnailExportFlow():将缩略图信息导出并保存为json
    function thumbnailExportFlow(){
        var connections=[],//connections:所有连接线信息
            blocks=[];//blocks:所有元素信息
        $.each(thumbnailInstance.getConnections(),function(i,p){
            var sourceId=p.sourceId;
            var targetId=p.targetId;
            sourceId=sourceId.slice(sourceId.indexOf("_")+1);
            targetId=targetId.slice(targetId.indexOf("_")+1);
            connections.push({
                connectionId: p.id,//connectionId:连接线id
                sourceId: sourceId,//sourceId:起点id
                targetId: targetId//targetId:终点id
            });
        });
        $.each($(".blockThumb"),function(i,p){
            var $p=$(p);
            var nodeId=$p.attr("id");
            nodeId=nodeId.slice(nodeId.indexOf("_")+1);
            blocks.push({
                blockId: nodeId,//blockId:元素id
                type:thumbnailTree[$p.attr("id")]["data"]["data-blocktype"],
                css:{
                    "top": $p.css("top"),//blockTop:元素绝对定位top
                    "left": $p.css("left")//blockLeft:元素绝对定位left
                },
                data:{
                    blockTitle:$p.attr("title"),//blockTitle:元素的title
                    /*blockWidth:$p.css("width"),//blockWidth:元素的width
                     blockHeight: $p.css("height"),//blockHeight:元素的height*/
                    blockHtml: $p.html()//blockHtml:元素的html
                }
            });
        });
        //jsonExport:将流程图信息以json格式输出
        var jsonExport="{"+'"connections":'+JSON.stringify(connections)+","+'"blocks":'+JSON.stringify(blocks)+"}";
        console.log("jsonExport:"+jsonExport);
        return jsonExport;
    }
//thumbnailImportFlow(data):将缩略图json导入生成流程图
    function thumbnailImportFlow(data){
        //clearAll();//清空当前流程图容器中所有数据
        var jsonImport=JSON.parse(data);//出入的json数据转换为js对象
        $.each(jsonImport["blocks"],function(i,p){
            let newHtml = '<div id="'+p.blockId+'" class="blockType">'+p.data.blockHtml+'</div>';
            $("#flowContainer").append(newHtml);
            let newDiv = $('#'+ p.blockId);
            newDiv.css(p.css);
            /*newDiv.css({
             width: p.data.blockWidth,
             height: p.data.blockHeight
             });*/
            newDiv.data("blocktype", p.type);
            newDiv.attr("data-blocktype", p.type);
            newDiv.attr("title", p.data.blockTitle);
            allBlockType.push(p.type);
            initNode(newDiv.get(0));
        });
        $.each(jsonImport["connections"],function(i,p){
            var imSourceId=p.sourceId;
            var imTargetId=p.targetId;
            instance.connect({
                source:imSourceId,
                target:imTargetId,
                endpoint:"Blank",
                anchor:"AutoDefault",
                overlays: [
                    ["Arrow",{width:10,height:30,location:0.5}]
                ]
            },connectorPaintStyle);
        });
    }
    //缩略图显示在主流程图中
    thumbnailCon.on("click",function(){
        var currentFlowId=$("#newFlowContainer").children(".active").attr("id");
        allFlowChart[currentFlowId]=exportFlow();
        clearAll();
        $("#newFlowContainer").children().removeClass("active");
        $("#newFlowContainer").append('<div class="newFlow active" id="thumbnailFlow">缩略图<i>x</i></div>');
        var thumbnailExportJson=thumbnailExportFlow();
        thumbnailImportFlow(thumbnailExportJson);
        $(".blockType>img").css("width",20);
        $(".blockType>span").css("font-size",10);
        $(".blockType>span>img").css("width",10);
        stateId="clickBtn";
    });





});
//$("#btns"):状态模式按钮
$("#btns").click(function(e){
    stateId=$(e.target).attr("id");
    state($('.blockType'));
});
//state:状态函数
var state=function(element){
    if(stateId=="dragBtn"){//拖动状态
        $("#blockProp").css("display","none");
        saveNodePropBtn.prop("disabled",true);//元素属性保存按钮不可用
        instance.setDraggable(element,true);//元素可拖拽
        instance.setSourceEnabled(element,false);//元素不做起点
        instance.setTargetEnabled(element,false);//元素不做终点
    }
    else if(stateId=="conBtn"){//连线状态
        $("#blockProp").css("display","none");
        saveNodePropBtn.prop("disabled",true);//元素属性保存按钮不可用
        instance.setDraggable(element,false);//元素不可拖拽
        instance.setSourceEnabled(element,true);//元素做起点
        instance.setTargetEnabled(element,true);//元素做终点

    }
    else if(stateId=="clickBtn"){//点击状态
        instance.setDraggable(element,false);//元素不可拖拽
        instance.setSourceEnabled(element,false);//元素不做起点
        instance.setTargetEnabled(element,false);//元素不做终点
        saveNodePropBtn.prop("disabled",false);//元素属性保存按钮可用
        $("#saveNodePropBtn").click(function(){//元素属性保存按钮点击事件
            target.attr("title",$("#titleInp").val());
            target.css("width",$("#widthInp").val());
            target.css("height",$("#heightInp").val());
            target.children("span").text($("#textInp").val());
        });
    }
    else if(stateId=="exBtn"){saveNodePropBtn.prop("disabled",true);}//导出状态:元素属性保存按钮不可用
    else if(stateId=="imBtn"){saveNodePropBtn.prop("disabled",true);}//导入状态:元素属性保存按钮不可用
};
var thumbnailTree={};//缩略图的数据结构
var thumbnailJson=function(block){
  var blockId=block.id;
  thumbnailTree["thumb_"+blockId]={
      "id":"thumb_"+blockId,
      "blockId":blockId,
      "css":{},
      "data":{},
      "parentIds":{},
      "subIds":{}
  };
};
//如果要删除的block后还有兄弟节点，删除该block后兄弟节点的位置向前移
var removeIndex=function(index,count,ids){
    for(var i=parseFloat(index)+1;i<=count;i++){
        ids[i-1]=ids[i];
        delete ids[i];
    }
};
//在缩略图中追加新的block
var newThumbNode=function(blockId){
    var d=document.createElement("div");
    d.className="blockThumb";
    d.id="thumb_"+blockId;
    var type=$("#"+blockId).attr("data-blocktype");
    d.innerHTML='<img src="images/'+type+'.png"/><span>'+$("#"+type).attr("title")+'</span>';
    thumbnailInstance.getContainer().appendChild(d);
    return d;
};
//数组去重
var removeRepeat=function(arr){
    for(var i=0,hash={},result=[];i<arr.length;i++){
        if(hash[arr[i]]===undefined){hash[arr[i]]=true;result.push(arr[i]);}
    }
    return result;
};
//计算数组中大于某个值的数的个数
var nodeCount=function(arr,value){
    for(var i=0,count=0;i<arr.length;i++){
        if(arr[i]>value){count++;}
    }
    return count;
};
/*作用：查找所有各级子节点中最大的top值*/
var subIdsTop=[];//存放所有子节点的top值
var subIdMaxTop=function(subIds,subIdsCount){
    for(var i=1;i<=subIdsCount;i++){
        var nodeSubIdsTop=thumbnailTree[subIds[i]]["css"]["top"];
        subIdsTop.push(nodeSubIdsTop);
        var subIdsSubIds=thumbnailTree[subIds[i]]["subIds"];
        var subIdsSubIdsCount=subIdsSubIds["count"];
        if(subIdsSubIdsCount){subIdMaxTop(subIdsSubIds,subIdsSubIdsCount);}
    }
    var nodeMaxTop=Math.max.apply(null,subIdsTop);
    return nodeMaxTop;
};
/*作用：查找所有各级子节点中最小的top值*/
var subIdMinTop=function(subIds,subIdsCount){
    for(var i=1;i<=subIdsCount;i++){
        var nodeSubIdsTop=thumbnailTree[subIds[i]]["css"]["top"];
        subIdsTop.push(nodeSubIdsTop);
        var subIdsSubIds=thumbnailTree[subIds[i]]["subIds"];
        var subIdsSubIdsCount=subIdsSubIds["count"];
        if(subIdsSubIdsCount){subIdMinTop(subIdsSubIds,subIdsSubIdsCount);}
    }
    var nodeMinTop=Math.min.apply(null,subIdsTop);
    return nodeMinTop;
};


/*作用：缩略图中调整父级Block及祖先block的top定位==》第一个子block和最后一个子block的中间位置*/
var resetParentIdTop=function(parentId,firstInd,lastInd){
    var parentIdSubIds=thumbnailTree[parentId]["subIds"];
    var parentIdFirstSubId=parentIdSubIds[firstInd];
    var parentIdFirstSubIdTop=parseFloat($("#"+parentIdFirstSubId).css("top"));
    var parentIdLastSubId=parentIdSubIds[lastInd];
    var parentIdLastSubIdTop=parseFloat($("#"+parentIdLastSubId).css("top"));
    var nowParentIdTop=(parentIdLastSubIdTop-parentIdFirstSubIdTop)/2+parentIdFirstSubIdTop;
    $("#"+parentId).css("top",nowParentIdTop);
    thumbnailTree[parentId]["css"]["top"]=nowParentIdTop;
    var parentIdParentIds=thumbnailTree[parentId]["parentIds"];
    var parentIdParentIdsCount=parentIdParentIds["count"];
    if(parentIdParentIdsCount){
        for(var i=1;i<=parentIdParentIdsCount;i++){
            var parentIdParentId=parentIdParentIds[i];
            var parentIdParentIdSubIds=thumbnailTree[parentIdParentId]["subIds"];
            var parentIdParentIdSubIdsCount=parentIdParentIdSubIds["count"];
            resetParentIdTop(parentIdParentId,1,parentIdParentIdSubIdsCount);
        }
    }
};
/*作用：（添加时）缩略图中计算一个block的新的top*/
var thumbNodeNewTop=function(nodeId,moveTop){
    var nodeTop=parseFloat($("#"+nodeId).css("top"));
    //var nowNodeTop=nodeTop+55;
    var nowNodeTop=nodeTop+moveTop;
    console.log("moveTop:"+moveTop);
    console.log("nowNodeTop:"+nowNodeTop);
    $("#"+nodeId).css("top",nowNodeTop);
    nodeTop=nowNodeTop;
    thumbnailTree[nodeId]["css"]["top"]=nodeTop;
    thumbNodeTop.push(nodeTop);
};
/*作用：（添加时）缩略图中子级block的top定位
 count：子节点的总个数
 subIds：存放所有子节点id的对象*/
var thumbSubIdTop=function(count,subIds,moveTop){
    for(var i=1;i<=count;i++){
        thumbNodeNewTop(subIds[i],moveTop);
        var subIdsSubIds=thumbnailTree[subIds[i]]["subIds"];//子级block下的子节点
        var subIdsSubIdsCount=subIdsSubIds["count"];
        if(subIdsSubIdsCount){
            thumbSubIdTop(subIdsSubIdsCount,subIdsSubIds,moveTop);//递归
        }
    }
};
/*作用：缩略图中调整兄弟节点的top*/
var resetBrotherIdTop=function(nodeId,subIds,count,moveTop){
    var index;
    for(key in subIds){
        if(subIds[key]==nodeId){index=parseFloat(key);}
    }
    for(var i=index+1;i<=count;i++){//遍历兄弟节点
        if(subIds[i]){//如果下面的兄弟节点存在
            var brotherId=subIds[i];
            var brotherSubIds=thumbnailTree[brotherId]["subIds"];
            var brotherSubIdsCount=brotherSubIds["count"];
            if(!brotherSubIdsCount){//如果下面的兄弟节点没有子节点
                thumbNodeNewTop(brotherId,moveTop);
            }
            else{//如果下面的兄弟节点存在子节点
                thumbNodeNewTop(brotherId,moveTop);
                thumbSubIdTop(brotherSubIdsCount,brotherSubIds,moveTop);
            }
        }
    }
};
/*作用：调整父节点的兄弟节点及祖先节点的兄弟节点的top*/
var resetParentBrotherTop=function(sourceParentId,subIdsCount,moveTop){
    var parentParentId=thumbnailTree[sourceParentId]["parentIds"][1];
    var parentParentSubIds=thumbnailTree[parentParentId]["subIds"];
    var parentParentSubIdsCount=parentParentSubIds["count"];
    if(subIdsCount>=2){//调整父节点的兄弟节点的top
        if(parentParentSubIdsCount>=2){
            resetBrotherIdTop(sourceParentId,parentParentSubIds,parentParentSubIdsCount,moveTop);
        }
    }
    var parentParentIdParentIdsCount=thumbnailTree[parentParentId]["parentIds"]["count"];
    if(parentParentIdParentIdsCount){
        resetParentBrotherTop(parentParentId,subIdsCount,moveTop);
    }
};
/*作用：获取缩略图中上一个兄弟节点的最大top==>在缩略图中根据上一个兄弟节点的最大top确定新的目标节点的位置*/
var prevSiblingMaxTop=function(prevId){
    var prevMaxTop;//上一个兄弟节点中最大的top
    var prevSiblingTop=thumbnailTree[prevId]["css"]["top"];
    var prevSiblingIdSubIds=thumbnailTree[prevId]["subIds"];
    var prevSiblingIdSubIdsCount=prevSiblingIdSubIds["count"];
    if(!prevSiblingIdSubIdsCount){//如果上一个兄弟节点没有子节点==》prevMaxTop=上一个兄弟节点的top
        prevMaxTop=prevSiblingTop;
    }
    else{//如果上一个兄弟节点存在子节点==》prevMaxTop=上一个兄弟节点的所有子节点中最大的top
        prevMaxTop=subIdMaxTop(prevSiblingIdSubIds,prevSiblingIdSubIdsCount)
    }
    return prevMaxTop;
};
/*作用：获取下一个兄弟节点的最小top*/
var nextSiblingMinTop=function(nextId){
    var nextMinTop;
    var nextSiblingTop=thumbnailTree[nextId]["css"]["top"];
    var nextSiblingIdSubIds=thumbnailTree[nextId]["subIds"];
    var nextSiblingIdSubIdsCount=nextSiblingIdSubIds["count"];
    if(!nextSiblingIdSubIdsCount){
        nextMinTop=nextSiblingTop;
    }
    else{
        nextMinTop=subIdMinTop(nextSiblingIdSubIds,nextSiblingIdSubIdsCount);
    }
    return nextMinTop;
};
/*作用：查找子节点或父节点或祖先节点是否有多个父节点*/
var allIsHasMoreParents=[];
var isMoreParent=function(nodeId){
    var isHasMoreParents=false;
    var subIds=thumbnailTree[nodeId]["subIds"];
    var subIdsCount=subIds["count"];
    for(var i=1;i<=subIdsCount;i++){//获得目标节点的兄弟节点的位置
        var subId=subIds[i];
        var subParentIds=thumbnailTree[subId]["parentIds"];
        var subParentIdsCount=subParentIds["count"];
        if(subParentIdsCount>1){
            allIsHasMoreParents.push(true);
        }
    }
    var parentIds=thumbnailTree[nodeId]["parentIds"];
    var parentIdsCount=parentIds["count"];
    if(parentIdsCount){
        var parentId=parentIds[1];
        isMoreParent(parentId);
    }
    $.each(allIsHasMoreParents,function(i,p){
        if(p){isHasMoreParents=true;}
    });
    return isHasMoreParents;
};
/*作用：缩略图中添加新元素并定位*/
var thumbnailNewNode=function(sourceId,targetId){
    //缩略图防止回环连接
    thumbnailInstance.bind("connection",function(info){
        var thumbConnection=info.connection;//连线
        var thumbSourceId=info.sourceId;//起点id
        var thumbTargetId=info.targetId;//终点id
        thumbnailInstance.getConnections().forEach(function(n,i){
            if(n.sourceId==thumbTargetId && n.targetId==thumbSourceId){thumbnailInstance.deleteConnection(thumbConnection);}
            else if(thumbSourceId==thumbTargetId){thumbnailInstance.deleteConnection(thumbConnection);}
        });
    });

    //连线时绘制缩略图
    var subId,//缩略图中源节点下的子节点id（即对应的目标节点）
        subNodeId,//在流程图中对应的block的id
        thumbNode,//缩略图中新添加的block
        prevSiblingId,//上一个兄弟节点的id
        prevMaxTop,//上一个兄弟节点的最大top
        prevNodeTop,//上一个兄弟节点的top
        prevNodeLeft;//上一个兄弟节点的left
    var sourceIdTop=parseFloat($("#thumb_"+sourceId).css("top"));
    var sourceIdLeft=parseFloat($("#thumb_"+sourceId).css("left"));
    var subIds=thumbnailTree["thumb_"+sourceId]["subIds"];
    var subIdsCount=subIds["count"];
    if(subIdsCount==1){subId=subIds[1];}
    else{
        for(var i=2;i<=subIdsCount;i++){subId=subIds[i];}
    }
    subNodeId=subId.slice(subId.indexOf("_")+1);
    var isContSubId=thumbnail.children("#"+subId).attr("id");

    var subBrotherParentIds,//subBrotherParentIds：目标节点的兄弟节点的父节点
        subBrotherParentIdsCount,//subBrotherParentIdsCount：目标节点的兄弟节点的父节点的个数
        subBrotherIndex;//subBrotherIndex:目标节点的兄弟节点的位置
    var subBrotherMoreParentId;//subBrotherMoreParentId：有多个父节点的兄弟节点的id
    if(!isContSubId){//如果缩略图容器中不存在目标节点==》一个节点有多个子节点但只有一个父节点
        if(sourceId!==targetId){//如果缩略图容器中不存在目标节点且不是连接的本身==》缩略图中新添加节点
            thumbNode=newThumbNode(subNodeId);
        }
        //确定新节点的位置
        if(subIdsCount==1){//如果缩略图容器中不存在目标节点且没有兄弟节点==》节点位置top和父节点一致
            prevNodeTop=sourceIdTop;
            prevNodeLeft=sourceIdLeft+50;
        }
        else if(subIdsCount>=2){//如果缩略图容器中不存在目标节点且有兄弟节点

            for(var j=1;j<subIdsCount;j++){//获得目标节点的兄弟节点的位置
                var subBrotherId=subIds[j];
                subBrotherParentIds=thumbnailTree[subBrotherId]["parentIds"];
                subBrotherParentIdsCount=subBrotherParentIds["count"];
                if(subBrotherParentIdsCount>1){
                    subBrotherMoreParentId=subBrotherId;
                }

                if(!subBrotherMoreParentId){//如果兄弟节点只有一个父节点
                    prevSiblingId=subIds[subIdsCount-1];
                    prevMaxTop=prevSiblingMaxTop(prevSiblingId);//上一个兄弟节点中最大的top
                    prevNodeTop=prevMaxTop+55;
                    prevNodeLeft=sourceIdLeft+50;
                    $("#"+subId).css({"top":prevNodeTop,"left":prevNodeLeft});
                }
                else{//如果兄弟节点有多个父节点
                    for(key in subIds){
                        if(subIds[key]==subBrotherMoreParentId){subBrotherIndex=parseFloat(key);console.log("subBrotherIndex:"+subBrotherIndex);}
                    }
                    if(subIdsCount==2){
                        if(subBrotherIndex==1){
                            prevNodeTop=sourceIdTop;
                            prevNodeLeft=sourceIdLeft+50;
                        }
                        else{
                            prevSiblingId=subIds[subIdsCount-1];
                            prevMaxTop=prevSiblingMaxTop(prevSiblingId);//上一个兄弟节点中最大的top
                            prevNodeTop=prevMaxTop+55;
                            prevNodeLeft=sourceIdLeft+50;
                            $("#"+subId).css({"top":prevNodeTop,"left":prevNodeLeft});
                        }
                    }
                    else if(subIdsCount>2){
                        if(subBrotherIndex==subIdsCount){prevSiblingId=subIds[subIdsCount-1];console.log("prevSiblingId:"+prevSiblingId);}
                        else{prevSiblingId=subIds[subIdsCount-1];console.log("prevSiblingId:"+prevSiblingId);}
                        prevMaxTop=prevSiblingMaxTop(prevSiblingId);//上一个兄弟节点中最大的top
                        prevNodeTop=prevMaxTop+55;
                        prevNodeLeft=sourceIdLeft+50;
                        $("#"+subId).css({"top":prevNodeTop,"left":prevNodeLeft});
                    }
                    console.log("subBrotherParentIdsCount>1");
                }
            }
        }
        $(thumbNode).css({"top":prevNodeTop,"left":prevNodeLeft});
        thumbnailTree[subId]["css"]={"top":prevNodeTop,"left":prevNodeLeft};
        thumbNodeTop.push(prevNodeTop);
        thumbNodeLeft.push(prevNodeLeft);
        var isHasMoreParents=isMoreParent("thumb_"+sourceId);
        //console.log("isHasMoreParents:"+isHasMoreParents);
        if(!isHasMoreParents){
            //调整兄弟节点及祖先节点的兄弟节点的top
            var sourceParentIds=thumbnailTree["thumb_"+sourceId]["parentIds"];
            var sourceParentIdsCount=sourceParentIds["count"];
            console.log("sourceParentIdsCount:"+sourceParentIdsCount);
            if(sourceParentIdsCount){
                var sourceParentId,sourceParentSubIds,sourceParentSubIdsCount;
                sourceParentId=sourceParentIds[1];
                //父节点的子节点
                sourceParentSubIds=thumbnailTree[sourceParentId]["subIds"];
                sourceParentSubIdsCount=sourceParentSubIds["count"];
                //父节点的父节点及祖先节点
                var parentParentIdsCount=thumbnailTree[sourceParentId]["parentIds"]["count"];
                if(parentParentIdsCount){
                    resetParentBrotherTop(sourceParentId,subIdsCount,55);
                }
                if(subIdsCount>=2){//调整兄弟节点的top
                    if(sourceParentSubIdsCount>=2){
                        resetBrotherIdTop("thumb_"+sourceId,sourceParentSubIds,sourceParentSubIdsCount,55);
                    }
                }
            }
            //调整父节点及祖先节点的top
            resetParentIdTop("thumb_"+sourceId,1,subIdsCount);
        }
        else{
            //调整兄弟节点及祖先节点的兄弟节点的top
            var sourcePtIds=thumbnailTree["thumb_"+sourceId]["parentIds"];
            var sourcePtIdsCount=sourcePtIds["count"];
            console.log("sourcePtIdsCount:"+sourcePtIdsCount);
            if(sourcePtIdsCount){
                var sourcePtId,sourcePtSubIds,sourcePtSubIdsCount;
                sourcePtId=sourcePtIds[1];
                console.log("sourcePtId:"+sourcePtId);
                //父节点的子节点
                sourcePtSubIds=thumbnailTree[sourcePtId]["subIds"];
                sourcePtSubIdsCount=sourcePtSubIds["count"];
                //父节点的父节点及祖先节点
                var ptParentIdsCount=thumbnailTree[sourcePtId]["parentIds"]["count"];
                if(ptParentIdsCount){
                    resetParentBrotherTop(sourcePtId,subIdsCount,55);
                }
                if(subIdsCount>2){//调整兄弟节点的top
                    if(sourcePtSubIdsCount>=2){
                        resetBrotherIdTop("thumb_"+sourceId,sourcePtSubIds,sourcePtSubIdsCount,55);
                    }
                }
            }
            if(subIdsCount>2){
                if(subBrotherIndex==1){
                    console.log(1);
                    //调整父节点及祖先节点的top
                    resetParentIdTop("thumb_"+sourceId,2,subIdsCount);
                }
                else if(subBrotherIndex==subIdsCount){
                    console.log(2);
                    //调整父节点及祖先节点的top
                    resetParentIdTop("thumb_"+sourceId,1,subIdsCount-1);
                }
                else{
                    console.log(3);
                    //调整父节点及祖先节点的top
                    resetParentIdTop("thumb_"+sourceId,1,subIdsCount);
                }
            }
        }


    }
    else if(isContSubId){//如果缩略图容器中已存在目标节点==》一个节点有多个父节点
        console.log("isContSubId.....");
    }



    //控制缩略图中block不超出边界
    thumbNodeTop=removeRepeat(thumbNodeTop);
    thumbNodeLeft=removeRepeat(thumbNodeLeft);
    var maxTopCount=nodeCount(thumbNodeTop,400);//缩略图中最大top=400
    var maxLeftCount=nodeCount(thumbNodeLeft,260);//缩略图中最大left=260
    if(maxLeftCount||maxTopCount){
        var transZ=-300*(maxLeftCount+maxTopCount);
        thumbnail.css("transform","translateZ("+transZ+"px)");
    }


    //缩略图中block连线
    thumbnailInstance.repaintEverything();
    thumbnailInstance.connect({
        source:"thumb_"+sourceId,
        target:subId,
        endpoint:"Blank",
        anchor:["Right", "Left"],
        Connector: [ "StateMachine"],
        overlays: [
            ["Arrow",{width:6,height:2,location:0.5}]
        ]
    });
};


