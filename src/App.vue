/**
* @Description:    下载geoJson文件
* @Author:         TSY
* @CreateDate:     2018/9/5 9:04
* @email:          t@tsy6.com
*/
<template>
  <div class="body">
    <div class="map">
      <map-range :download-tips="downloadTips"
                 @change="search"
                 @click="downloadJson"></map-range>
    </div>
    <div class="echarts">
      <div id="map"></div>
    </div>
    <div class="tips"
         v-show="isShowTips">正在下载，请耐心等待。。。(可打开控制台查看进度详情)</div>
    <!--哎呀呀，这就是打赏弹窗，为方便你们删除，就单独抽出一个组件来吧-->
    <money-dialog ref="dialog"
                  @confirm="downloadAllJson"></money-dialog>
    <!--github入口-->
    <github></github>
    <!--乡镇数据广告弹窗-->
    <street-dialog ref="streetDialog"
                   @confirm="contact"></street-dialog>
  </div>
</template>

<script>
import JSZip from 'jszip'
import saveAs from './saveAs'
import MapRange from "./MapRange";
import MoneyDialog from "./MoneyDialog";
import StreetDialog from "./StreetDialog";
import Github from "./Github";

export default {
  name: "demo",
  components: {
    Github,
    MoneyDialog,
    StreetDialog,
    MapRange
  },
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
      mapData: [],
      zip: {},//打包zip
      codeList: [],
      isCodeListLoadComplete: false,//codeList是否全部获取完毕
      downloadTips: '下载geoJson数据',//下载进度提示
      isShowTips: false,//是否显示下载提示
    }
  },
  mounted() {
    //实例化zip对象
    this.zip = new JSZip();

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
  watch: {
    isCodeListLoadComplete(val) {
      if (val) {
        this.loadAllGeoJson();
      }
    }
  },
  methods: {
    downloadMapCode() {// 下载mapCode数据
      let mapCode = [], cityMapCode = [], provinceMapCode = [], provinceList = [], cityList = [],
        districtList = [];

      provinceList = this.codeList.filter(item => {
        return item.level === 'province'
      })
      cityList = this.codeList.filter(item => {
        return item.level === 'city'
      })
      districtList = this.codeList.filter(item => {
        return item.level === 'district'
      })

      districtList.forEach(item => {
        mapCode.push({
          name: item.name,
          cityCode: item.code,
          fatherCode: `${item.code.substring(0, 4)}00`,
          children: []
        })
      })

      // 筛选出直辖市下面的区县
      let direct = mapCode.filter(item => {
        return item.fatherCode.includes('0000');
      })

      for (let i in cityList) {
        let children = []
        for (let j in mapCode) {
          if (mapCode[j].fatherCode == cityList[i].code) {
            children.push(mapCode[j])
          }
        }
        cityMapCode.push({
          name: cityList[i].name,
          cityCode: cityList[i].code,
          fatherCode: `${cityList[i].code.substring(0, 2)}0000`,
          children: children
        })
      }
      cityMapCode = cityMapCode.concat(direct);

      for (let i in provinceList) {
        let children = []
        for (let j in cityMapCode) {
          if (cityMapCode[j].fatherCode == provinceList[i].code) {
            children.push(cityMapCode[j])
          }
        }
        provinceMapCode.push({
          name: provinceList[i].name,
          cityCode: provinceList[i].code,
          fatherCode: '100000',
          children: children
        })
      }

      if (provinceMapCode.length === 0) return
      this.zip.file(`mapCode.json`, JSON.stringify(provinceMapCode));
      this.downloadTips = '文件打包压缩中...';
      this.zip.generateAsync({ type: "blob" })
        .then((content) => {
          saveAs(content, "mapCode.zip");
        });
    },
    echartsMapClick(params) {//地图点击事件
      this.$ba.trackEvent('echartsMap', '点击地图', `${params.data.name}-${params.data.cityCode}`);
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
          mapJson.type = "FeatureCollection";
          mapJson.features = areaNode.getSubFeatures();
          this.loadMap(this.cityName, mapJson);
          this.geoJsonData = mapJson;
        });
      });
    },
    showTips() {
      this.isShowTips = true;
      setTimeout(() => {
        this.isShowTips = false;
      }, 3000)
    },
    downloadJson(nameType) {//geo文件下载
      if (nameType === 'all') {
        this.$ba.trackEvent('echartsMap', '文件下载', '打包下载全部');
        this.$refs.dialog.show();
        return;
      }
      if (nameType === 'street') {
        this.$ba.trackEvent('echartsMap', '文件下载', '下载乡镇数据');
        this.$refs.streetDialog.show();
        return;
      }
      var blob = new Blob([JSON.stringify(this.geoJsonData)], { type: "text/plain;charset=utf-8" });
      let filename = this.cityName;
      if (nameType === 'code') {
        filename = this.cityCode;
      }
      this.$ba.trackEvent('echartsMap', '文件下载', filename);
      saveAs(blob, `${filename}.geoJson`);//filename
    },
    downloadAllJson() {//一次打包下载所有的数据
      this.showTips();
      if (this.downloadTips != '下载geoJson数据') {
        return;
      }
      this.codeList = [];

      this.downloadTips = '获取数据中...';

      //                this.district.setLevel('country'); //行政区级别
      this.district.setExtensions('all');
      console.log('开始递归循环获取地区code..');
      this.loopSearch('中国');

    },
    loopSearch(code) {
      setTimeout(() => {
        this.district.search(code, (status, result) => {
          if (status == 'complete') {
            console.log(`${code}--获取成功`)
            for (let i in result.districtList[0].districtList) {
              this.codeList.push({
                name: result.districtList[0].districtList[i].name,
                code: result.districtList[0].districtList[i].adcode,
                level: result.districtList[0].districtList[i].level
              })
              //这边没想出来怎么判断数据是否全部加载完毕了，只能采用这种死办法
              //有更好解决方案的大佬，麻烦告诉我一下，邮箱t@tsy6.com
              //或者直接Github提交PR，在此不胜感激
              if (this.codeList.length >= 428) {// 为 3718 时，获取区县数据，428 省市数据
                console.log('code获取完成');
                this.isCodeListLoadComplete = true;
              }
              if (result.districtList[0].districtList[i].adcode && result.districtList[0].districtList[i].level != 'city' && result.districtList[0].districtList[i].level != 'district' && result.districtList[0].districtList[i].level != 'street') {
                this.loopSearch(result.districtList[0].districtList[i].adcode)
              }
            }
          } else {//第一遍查询出错，再次执行查询
            console.log(`${code}--第一次获取失败，正在尝试进行第二次获取`)
            this.district.search(code, (status, result) => {
              if (status == 'complete') {
                console.log(`${code}--第二次获取成功`)
                for (let i in result.districtList[0].districtList) {
                  this.codeList.push({
                    name: result.districtList[0].districtList[i].name,
                    code: result.districtList[0].districtList[i].adcode,
                    level: result.districtList[0].districtList[i].level
                  })
                  //这边没想出来怎么判断数据是否全部加载完毕了，只能采用这种死办法
                  //有更好解决方案的大佬，麻烦告诉我一下，邮箱t@tsy6.com
                  //或者直接Github提交PR，在此不胜感激
                  if (this.codeList.length >= 428) {
                    console.log('code获取完成');
                    this.isCodeListLoadComplete = true;
                  }
                }
              } else {
                console.log(`${code}--第二次获取失败，请联系email：t@tsy6.com`)
              }
            })
          }
        });
      }, 500)
    },
    loadAllGeoJson() {//通过codeList加载全部geoJson数据
      console.log('开始加载geoJson数据');
      AMapUI.loadUI(['geo/DistrictExplorer'], DistrictExplorer => {

        //创建一个实例
        var districtExplorer = window.districtExplorer = new DistrictExplorer({
          eventSupport: true, //打开事件支持
          map: this.map
        });
        let mapJson = {};
        for (let i in this.codeList) {
          setTimeout(() => {
            districtExplorer.loadAreaNode(this.codeList[i].code, (error, areaNode) => {
              if (error) {
                this.codeList[i].geo = 'error';
                console.log(`${this.codeList[i].name}--${this.codeList[i].code}，geo 数据获取失败，高德地图的锅^_^`)
              } else {
                mapJson.type = "FeatureCollection";
                mapJson.features = areaNode && areaNode.getSubFeatures() || '';
                this.codeList[i].geo = mapJson;
                console.log(`${this.codeList[i].level}--${this.codeList[i].name}--${this.codeList[i].code}，geo 数据获取成功，马上为你打包`)
              }

              if (this.codeList[i].level === 'province') {
                this.zip.file(`100000/${this.codeList[i].code}.geoJson`, JSON.stringify(mapJson));
              } else {
                this.zip.file(`100000/${this.codeList[i].code.substring(0, 2)}0000/${this.codeList[i].code}.geoJson`, JSON.stringify(mapJson));
              }

              if (this.codeList.every(item => item.geo)) {
                console.log('ziped');
                let readme = `\r\n
                                            项目源码github地址：https://github.com/TangSY/echarts-map-demo （欢迎star）
                                            \r\n
                                            个人空间：https://www.hxkj.vip （欢迎闲逛）
                                            \r\n
                                             Email：t@tsy6.com  （遇到问题可以反馈）
                                         `;
                this.zip.file(`readMe(sourceCode).txt`, readme);
                this.downloadTips = '文件打包压缩中...';
                this.zip.generateAsync({ type: "blob" })
                  .then((content) => {
                    saveAs(content, "geoJson数据包.zip");
                    this.downloadTips = '下载geoJson数据';
                    this.isCodeListLoadComplete = false;
                    this.$ba.trackEvent('echartsMap', '文件下载', '打包下载成功');
                  });
              }
            });
          }, 100 * i)
        }
      });
    },
    loadMap(mapName, data) {
      if (data) {
        this.$echarts.registerMap(mapName, data);
        var option = {
          visualMap: {
            type: 'piecewise',
            pieces: [
              { max: 30, label: '安全', color: '#2c9a42' },
              { min: 30, max: 60, label: '警告', color: '#d08a00' },
              { min: 60, label: '危险', color: '#c23c33' },
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
              mapJson.type = "FeatureCollection";
              mapJson.features = [].concat(mapJsonList[i]);
            }
          }
          this.mapData = [];
          this.mapData.push({ name: this.cityName, value: Math.random() * 100, level: curlevel });
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
      this.$ba.trackEvent('echartsMap', '筛选地图', `${this.cityName}-${this.cityCode}`);
      this.district.setLevel(option.value); //行政区级别
      this.district.setExtensions('all');
      //行政区查询
      //按照adcode进行查询可以保证数据返回的唯一性
      this.district.search(adcode, (status, result) => {
        if (status === 'complete') {
          this.getData(result.districtList[0], obj.id, adcode);
        }
      });
    },
    // 联系下载乡镇数据
    contact() {
      this.$ba.trackEvent('echartsMap', '文件下载', '联系下载');
      if (/(iPhone|iPad|iPod|iOS|android)/i.test(navigator.userAgent)) {
        window.open('mqqwpa://im/chat?chat_type=wpa&uin=2890228902&version=1&src_type=web&web_src=http:://wpa.b.qq.com');
      } else {
        window.open('http://wpa.qq.com/msgrd?v=3&uin=2890228902&site=在线客服&menu=yes');
      }
    }
  }
}
</script>

<style lang="stylus" scoped>
*
  font-size 14px
.body
  display flex
  width 100%
.map, .echarts
  width 0
  flex 1
.echarts
  background url('./images/bg_bigdata.png') no-repeat
  background-size 100% 100%
#map
  width 100%
  height 100vh
.tips
  position fixed
  bottom 30%
  left 40%
  padding 10px 15px
  border-radius 5px
  color #fff
  background rgba(0, 0, 0, 0.8)
  z-index 999
</style>
