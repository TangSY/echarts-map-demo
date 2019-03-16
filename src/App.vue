/**
* @Description:    下载geoJson文件
* @Author:         TSY
* @CreateDate:     2018/9/5 9:04
* @email:          t@tsy6.com
*/
<template>
    <div class="body">
        <div class="map">
            <map-range @change="search" @click="downloadJson"></map-range>
        </div>
        <div class="echarts">
            <div id="map"></div>
        </div>
    </div>
</template>

<script>
    import saveAs from './saveAs'
    import MapRange from "./MapRange";

    export default {
        name: "demo",
        components: {MapRange},
        data() {
            return {
                cityName: '中国',
                areaCode: 10000,
                geoJsonData: '',
                echartsMap: null,
                map: null,
                uimap: null,
                district: null,
                polygons: [],
                cityCode: 100000,
                citySelect: null,
                districtSelect: null,
                opts: {},
                areaData: {},
                mapData: []
            }
        },
        mounted() {
            this.citySelect = document.getElementById('city');
            this.districtSelect = document.getElementById('district');
            this.echartsMap = this.$echarts.init(document.getElementById('map'));
            this.echartsMap.on('click', this.echartsMapClick);

            this.map = new AMap.Map('container', {
                resizeEnable: true,
                center: [116.30946, 39.937629],
                zoom: 3
            });
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
        },
        methods: {
            echartsMapClick(params) {//地图点击事件
                if (params.data.level == 'street') return;
                //清除地图上所有覆盖物
                for (var i = 0, l = this.polygons.length; i < l; i++) {
                    this.polygons[i].setMap(null);
                }
                this.cityName = params.data.name;
                this.cityCode = params.data.cityCode;
                this.district.setLevel(params.data.level); //行政区级别
                this.district.setExtensions('all');
                //行政区查询
                //按照adcode进行查询可以保证数据返回的唯一性
                this.district.search(this.cityCode, (status, result) => {
                    if (status === 'complete') {
                        this.getData(result.districtList[0], params.data.level, this.cityCode);
                    }
                });
            },
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
                        mapJson.features = areaNode.getSubFeatures();
                        this.loadMap(this.cityName, mapJson);
                        this.geoJsonData = mapJson;
                    });
                });
            },
            downloadJson(nameType) {
                var blob = new Blob([JSON.stringify(this.geoJsonData)], {type: "text/plain;charset=utf-8"});
                let filename = this.cityName;
                if (nameType === 'code') {
                    filename = this.cityCode;
                }
                saveAs(blob, `${filename}.geoJson`);//filename
            },
            loadMap(mapName, data) {
                if (data) {
                    this.$echarts.registerMap(mapName, data);
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
                            data: this.mapData,
                        }]
                    };
                    this.echartsMap.setOption(option);
                }
            },
            getData(data, level, adcode) {
                var bounds = data.boundaries;
                if (bounds) {
                    for (var i = 0, l = bounds.length; i < l; i++) {
                        var polygon = new AMap.Polygon({
                            map: this.map,
                            strokeWeight: 1,
                            strokeColor: '#0091ea',
                            fillColor: '#80d8ff',
                            fillOpacity: 0.2,
                            path: bounds[i]
                        });
                        this.polygons.push(polygon);
                    }
                    this.map.setFitView();//地图自适应
                }

                //清空下一级别的下拉列表
                if (level === 'province') {
                    this.citySelect.innerHTML = '';
                    this.districtSelect.innerHTML = '';
                } else if (level === 'city') {
                    this.districtSelect.innerHTML = '';
                }

                var subList = data.districtList;
                if (subList) {
                    var contentSub = new Option('--请选择--');
                    var curlevel = subList[0].level;
                    if (curlevel === 'street') {
                        let mapJsonList = this.geoJsonData.features;
                        let mapJson = {};
                        for (let i in mapJsonList) {
                            if (mapJsonList[i].properties.name == this.cityName) {
                                mapJson.features = [].concat(mapJsonList[i]);
                            }
                        }
                        this.mapData = [];
                        this.mapData.push({name: this.cityName, value: Math.random() * 100, level: curlevel});
                        this.loadMap(this.cityName, mapJson);
                        this.geoJsonData = mapJson;
                        return;
                    }
                    var curList = document.querySelector('#' + curlevel);
                    curList.add(contentSub);
                    this.mapData = [];
                    for (var i = 0, l = subList.length; i < l; i++) {
                        var name = subList[i].name;
                        var cityCode = subList[i].adcode;
                        this.mapData.push({
                            name: name,
                            value: Math.random() * 100,
                            cityCode: cityCode,
                            level: curlevel
                        });
                        var levelSub = subList[i].level;
                        contentSub = new Option(name);
                        contentSub.setAttribute("value", levelSub);
                        contentSub.center = subList[i].center;
                        contentSub.adcode = subList[i].adcode;
                        curList.add(contentSub);
                    }
                    this.loadMapData(adcode);
                    this.areaData[curlevel] = curList;
                }

            },
            search(area) {
                let obj = this.areaData[area];
                //清除地图上所有覆盖物
                for (var i = 0, l = this.polygons.length; i < l; i++) {
                    this.polygons[i].setMap(null);
                }
                var option = obj[obj.options.selectedIndex];
                var keyword = option.text; //关键字
                var adcode = option.adcode;
                this.cityName = keyword;
                this.cityCode = adcode;
                this.district.setLevel(option.value); //行政区级别
                this.district.setExtensions('all');
                //行政区查询
                //按照adcode进行查询可以保证数据返回的唯一性
                this.district.search(adcode, (status, result) => {
                    if (status === 'complete') {
                        this.getData(result.districtList[0], obj.id, adcode);
                    }
                });
            }
        }
    }
</script>

<style lang="stylus" scoped>

    * {
        font-size 14px
    }

    .body {
        display flex
        width 100%
    }

    .map, .echarts {
        width 0
        flex 1
    }

    .echarts {
        background: url("./images/bg_bigdata.png") no-repeat
        background-size 100% 100%
    }

    #map {
        width 100%
        height 100vh
    }
</style>
