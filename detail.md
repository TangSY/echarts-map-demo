#####首先，来看下效果图
![map.gif](https://upload-images.jianshu.io/upload_images/7412714-3edd0e7bc2c810fa.gif?imageMogr2/auto-orient/strip)

在线体验地址：[https://hxkj.vip/demo/echartsMap/](https://hxkj.vip/demo/echartsMap/)，并提供实时 geoJson 数据文件下载
echarts 官方社区链接地址（可在线编辑）：[https://gallery.echartsjs.com/editor.html?c=xmCAi_XNuJ](https://gallery.echartsjs.com/editor.html?c=xmCAi_XNuJ)

> 前段时间给公司弄了一套基于 echarts map 的地图数据展示的平台，开发过程中发现百度官方已经不提供地图下载了，于是只能期望能在网上搜到哪位大佬帮忙收集的 json 文件。找是找到了，然鹅发现大部分都年代久远了，很多地区其实已经重新划分行政区划了。
> 所以，只能想想其他办法了，回想起平常使用高德地图搜索某个地名的时候，好像会有个边界区域给我们绘制出来，然后我就觉得它既然能画出来，应该会有办法从某些渠道获取，或者高德地图会提供相应的 API。于是乎，去到了高德开放平台仔细的查看了一下他提供的 api，哈哈，果然有！有了接口，接下来就是撸码了。

####第一步，通过高德 api 获取边界数据
通过查阅 API 文档可以知道，获取边界数据的接口为行政区查询服务（`AMap.DistrictSearch`）。使用该服务之前记得去申请一个 key，用于调用高德接口，申请地址直通车：[https://lbs.amap.com/dev/key/app](https://lbs.amap.com/dev/key/app)。
#####1、在页面添加 JS API 的入口脚本标签，并将其中「您申请的 key 值」替换为您刚刚申请的 key；

```
<script type="text/javascript" src="https://webapi.amap.com/maps?v=1.4.11&key=「您申请的key值」&plugin=AMap.DistrictSearch"></script>
```

#####2、通过以下方式获取数据，以获取中国地图为例；

```
this.opts = {
    subdistrict: 1,   //返回下一级行政区
    showbiz: false  //最后一级返回街道信息
};
this.district = new AMap.DistrictSearch(this.opts);//注意：需要使用插件同步下发功能才能这样直接使用
this.district.search('中国', (status, result) => {
    if (status == 'complete') {
        this.getData(result.districtList[0], '', 100000);
    }
});
getData(data, level, adcode) {//处理获取出来的边界数据
    var subList = data.districtList;
    if (subList) {
        var curlevel = subList[0].level;
        if (curlevel === 'street') {//为了配合echarts地图区县名称显示正常，这边街道级别数据需要特殊处理
            let mapJsonList = this.geoJsonData.features;
            let mapJson = {};
            for (let i in mapJsonList) {
                if (mapJsonList[i].properties.name == this.cityName) {
                    mapJson.features = [].concat(mapJsonList[i]);
                }
            }
            this.mapData = [];
            //这个mapData里包含每个区域的code、名称、对应的等级，实现第三步功能时能用上
            this.mapData.push({name: this.cityName, value: Math.random() * 100, level: curlevel});
            this.loadMap(this.cityName, mapJson);
            this.geoJsonData = mapJson;
            return;
        }

        //街道级以上的数据处理方式
        this.mapData = [];
        for (var i = 0, l = subList.length; i < l; i++) {
            var name = subList[i].name;
            var cityCode = subList[i].adcode;
            //这个mapData里包含每个区域的code、名称、对应的等级，实现第三步功能时能用上
            this.mapData.push({
                name: name,
                value: Math.random() * 100,
                cityCode: cityCode,
                level: curlevel
            });
        }
        this.loadMapData(adcode);
    }
},
```

#####3、接下来，利用 `AMapUI.loadUI`可以构造一个创建一个 `DistrictExplorer` 实例，然后利用 `DistrictExplorer` 的实例，可以根据当前需要加载城市的 `areaCode`获取到该城市的 `geo` 数据

```
loadMapData(areaCode) {
    AMapUI.loadUI(['geo/DistrictExplorer'], DistrictExplorer => {

        //创建一个实例
        var districtExplorer = window.districtExplorer = new DistrictExplorer({
            eventSupport: true, //打开事件支持
            map: this.map
        });

        districtExplorer.loadAreaNode(areaCode, (error, areaNode) => {

            if (error) {
                console.error(error);
                return;
            }
            let mapJson = {};
            //特别注意这里哦，如果查看过正常的geojson文件，都会发现，文件都是以features 字段开头的，所以这里要记得加上
            mapJson.features = areaNode.getSubFeatures();
            this.loadMap(this.cityName, mapJson);
        });
    });
},
```

####第二步，用 echarts 把边界数据渲染出来
我这边使用的 echarts 版本为当前的最新版`4.2.0`，相关文档查阅地址传送门：[https://echarts.baidu.com/option.html#series-map](https://echarts.baidu.com/option.html#series-map)。千万别看错文档了，他好几个版本放在一起，关键是每个版本某些属性会不一样，所以要特别注意文档的版本与引入的 echarts 版本保持一致。
#####1、在页面引入 JS 文件，我这边引入的`bootstrap cdn`提供的文件

```
<script src="https://cdn.bootcss.com/echarts/4.2.0-rc.2/echarts.min.js"></script>
```

#####2、注册 echarts 并使用刚刚通过高德 API 获取的数据渲染成 map

```
//html
<div id="map"></div>

//注册并赋值给echartsMap
this.echartsMap = this.$echarts.init(document.getElementById('map'));

//通过loadMap函数加载地图
loadMap(mapName, data) {
    if (data) {
        this.$echarts.registerMap(mapName, data);//把geoJson数据注入echarts
      //配置echarts的option
        var option = {
            visualMap: {
                type: 'piecewise',
                pieces: [
                    {max: 30, label: '安全', color: '#2c9a42'},
                    {min: 30, max: 60, label: '警告', color: '#d08a00'},
                    {min: 60, label: '危险', color: '#c23c33'},
                ],
                color: '#fff',
                textStyle: {
                    color: '#fff',
                },
                visibility: 'off'
            },
            series: [{
                name: '数据名称',
                type: 'map',
                roam: false,
                mapType: mapName,
                selectedMode: 'single',
                showLegendSymbol: false,
                visibility: 'off',
                itemStyle: {
                    normal: {
                        color: '#ccc',
                        areaColor: '#fff',
                        borderColor: '#fff',
                        borderWidth: 0.5,
                        label: {
                            show: true,
                            textStyle: {
                                color: "rgb(249, 249, 249)"
                            }
                        }
                    },
                    emphasis: {
                        areaColor: false,
                        borderColor: '#fff',
                        areaStyle: {
                            color: '#fff'
                        },
                        label: {
                            show: true,
                            textStyle: {
                                color: "rgb(249, 249, 249)"
                            }
                        }
                    }
                },
                data: this.mapData,//这个data里包含每个区域的code、名称、对应的等级，实现第三步功能时能用上
            }]
        };
        this.echartsMap.setOption(option);
    }
},
```

做完这一步，如果不出问题，中国地图已经安静的躺在你的屏幕上了！ ####第三步，实现省市区县下探功能
#####1、添加点击事件

```
this.echartsMap.on('click', this.echartsMapClick);

echartsMapClick(params) {//地图点击事件
    if (params.data.level == 'street') return;//此处的params.data为this.mapData里的数据
    this.cityCode = params.data.cityCode;
    //行政区查询
    //按照adcode进行查询可以保证数据返回的唯一性
    this.district.search(this.cityCode, (status, result) => {
        if (status === 'complete') {
            this.getData(result.districtList[0], params.data.level, this.cityCode);//这个getData函数在前面已经定义过了
        }
    });
},
```

####此项目这边是基于`VUE`开发的，看完之后有什么不懂的，可以留言说明.

项目 GitHub 地址：https://github.com/TangSY/echarts-map-demo

> 转载请注明出处：https://www.jianshu.com/p/c293c94d9ab7
> 作者：TSY
> 个人空间：https://www.hxkj.vip
