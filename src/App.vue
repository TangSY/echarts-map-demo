/**
* @Description:    下载geoJson文件
* @Author:         TSY
* @CreateDate:     2018/9/5 9:04
* @email:          t@tsy6.com
*/
<template>
  <div class="body">
    <div class="map">
      <map-range
        :download-tips="downloadTips"
        @change="search"
        @click="downloadJson"
      ></map-range>
    </div>
    <div class="echarts">
      <div id="map"></div>
    </div>
    <div class="tips" v-show="isShowTips">
      正在下载，请耐心等待。。。(可打开控制台查看进度详情)
    </div>
    <!--哎呀呀，这就是打赏弹窗，为方便你们删除，就单独抽出一个组件来吧-->
    <money-dialog ref="dialog" @confirm="dialogConfirm"></money-dialog>
    <!--github入口-->
    <github></github>
    <!-- GG位 -->
    <div class="gg" v-if="isShowAD">
      <div class="gg-close" @click="isShowAD = false"></div>
      <img @click="openAd" :src="AD_IMG" alt="" />
    </div>
    <!--乡镇数据弹窗-->
    <street-dialog ref="streetDialog" @confirm="contact"></street-dialog>
    <!--乡镇级联数据下载弹窗-->
    <map-data-dialog ref="mapDataDialog" @confirm="contact"></map-data-dialog>
  </div>
</template>

<script>
import JSZip from "jszip";
import saveAs from "./saveAs";
import MapRange from "./MapRange";
import MoneyDialog from "./MoneyDialog";
import StreetDialog from "./StreetDialog";
import mapDataDialog from "./mapDataDialog";
import Github from "./Github";
import { AD_IMG } from "./images/adimg";

export default {
  name: "demo",
  components: {
    Github,
    MoneyDialog,
    StreetDialog,
    mapDataDialog,
    MapRange,
  },
  data() {
    return {
      AD_IMG,
      isShowAD: true,
      nameType: "",
      cityName: "中国",
      areaCode: 10000,
      geoJsonData: "",
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
      zip: {}, //打包zip
      codeList: [],
      loadedNode: {}, // 记录已加载项
      waitToLoadList: [],
      loadingThreads: new Array(8).fill(null), // 8个并发

      isCodeListLoadComplete: false, //codeList是否全部获取完毕
      downloadTips: "下载geoJson数据", //下载进度提示
      isShowTips: false, //是否显示下载提示
    };
  },
  mounted() {
    //实例化zip对象
    this.zip = new JSZip();

    this.citySelect = document.getElementById("city");
    this.districtSelect = document.getElementById("district");
    this.echartsMap = this.$echarts.init(document.getElementById("map"));
    this.echartsMap.on("click", this.echartsMapClick);

    this.map = new AMap.Map("container", {
      resizeEnable: true,
      center: [116.30946, 39.937629],
      zoom: 3,
    });
    this.opts = {
      subdistrict: 1, //返回下一级行政区
      showbiz: false, //最后一级返回街道信息
    };
    this.district = new AMap.DistrictSearch(this.opts); //注意：需要使用插件同步下发功能才能这样直接使用
    this.district.search("中国", (status, result) => {
      if (status == "complete") {
        this.getData(result.districtList[0], "", 100000);
      }
    });
  },
  watch: {
    isCodeListLoadComplete(val) {
      if (val) {
        this.loadAllGeoJson();
      }
    },
  },
  methods: {
    downloadMapCode() {
      // 下载mapCode数据
      let mapCode = [],
        cityMapCode = [],
        provinceMapCode = [],
        provinceList = [],
        cityList = [],
        districtList = [];

      provinceList = this.codeList.filter((item) => {
        return item.level === "province";
      });
      cityList = this.codeList.filter((item) => {
        return item.level === "city";
      });
      districtList = this.codeList.filter((item) => {
        return item.level === "district";
      });

      districtList.forEach((item) => {
        mapCode.push({
          name: item.name,
          cityCode: item.code,
          fatherCode: `${item.code.substring(0, 4)}00`,
          children: [],
        });
      });

      // 筛选出直辖市下面的区县
      let direct = mapCode.filter((item) => {
        return item.fatherCode.includes("0000");
      });

      for (let i in cityList) {
        let children = [];
        for (let j in mapCode) {
          if (mapCode[j].fatherCode == cityList[i].code) {
            children.push(mapCode[j]);
          }
        }
        cityMapCode.push({
          name: cityList[i].name,
          cityCode: cityList[i].code,
          fatherCode: `${cityList[i].code.substring(0, 2)}0000`,
          children: children,
        });
      }
      cityMapCode = cityMapCode.concat(direct);

      for (let i in provinceList) {
        let children = [];
        for (let j in cityMapCode) {
          if (cityMapCode[j].fatherCode == provinceList[i].code) {
            children.push(cityMapCode[j]);
          }
        }
        provinceMapCode.push({
          name: provinceList[i].name,
          cityCode: provinceList[i].code,
          fatherCode: "100000",
          children: children,
        });
      }

      if (provinceMapCode.length === 0) return;
      this.zip.file(`mapCode.json`, JSON.stringify(provinceMapCode));
      this.downloadTips = "文件打包压缩中...";
      this.zip.generateAsync({ type: "blob" }).then((content) => {
        saveAs(content, "mapCode.zip");
      });
    },
    // 下载全国地名和编码（不包含边界数据）
    downloadNameAndCode() {
      let opts = {
        subdistrict: 3, //返回下一级行政区
        showbiz: false, //最后一级返回街道信息
      };
      let district = new AMap.DistrictSearch(opts); //注意：需要使用插件同步下发功能才能这样直接使用
      district.search("中国", function (status, result) {
        if (status === "complete") {
          getData(result.districtList[0]);
        }
      });
      let _this = this;
      function getData(data) {
        let districtList = data.districtList;

        let blob = new Blob([JSON.stringify(districtList)], {
          type: "text/plain;charset=utf-8",
        });
        let filename = "全国省市区县街道和编码（不包含边界数据）";
        _this.$ba &&
          this.$ba.trackEvent(
            "echartsMap",
            "全国省市区县街道和编码（不包含边界数据）下载",
            filename
          );
        saveAs(blob, `${filename}.json`); //filename
      }
    },
    echartsMapClick(params) {
      //地图点击事件
      this.$ba &&
        this.$ba.trackEvent(
          "echartsMap",
          "点击地图",
          `${params.data.name}-${params.data.cityCode}`
        );
      if (params.data.level == "street") return;
      //清除地图上所有覆盖物
      for (var i = 0, l = this.polygons.length; i < l; i++) {
        this.polygons[i].setMap(null);
      }
      this.cityName = params.data.name;
      this.cityCode = params.data.cityCode;
      this.district.setLevel(params.data.level); //行政区级别
      this.district.setExtensions("all");
      //行政区查询
      //按照adcode进行查询可以保证数据返回的唯一性
      this.district.search(this.cityCode, (status, result) => {
        if (status === "complete") {
          this.getData(
            result.districtList[0],
            params.data.level,
            this.cityCode
          );
        }
      });
    },
    loadMapData(areaCode) {
      AMapUI.loadUI(["geo/DistrictExplorer"], (DistrictExplorer) => {
        //创建一个实例
        var districtExplorer = (window.districtExplorer = new DistrictExplorer({
          eventSupport: true, //打开事件支持
          map: this.map,
        }));

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
      }, 3000);
    },
    downloadJson(nameType) {
      //geo文件下载
      this.nameType = nameType;
      if (nameType === "area") {
        this.$ba &&
          this.$ba.trackEvent("echartsMap", "文件下载", "下载级联数据");
        this.$refs.dialog.show();
        return;
      }
      if (nameType === "all") {
        this.$ba &&
          this.$ba.trackEvent("echartsMap", "文件下载", "打包下载全部");
        this.$refs.dialog.show();
        return;
      }
      if (nameType === "street") {
        this.$ba &&
          this.$ba.trackEvent("echartsMap", "文件下载", "下载乡镇数据");
        this.$refs.streetDialog.show();
        return;
      }
      var blob = new Blob([JSON.stringify(this.geoJsonData)], {
        type: "text/plain;charset=utf-8",
      });
      let filename = this.cityName;
      if (nameType === "code") {
        filename = this.cityCode;
      }
      this.$ba && this.$ba.trackEvent("echartsMap", "文件下载", filename);
      saveAs(blob, `${filename}.geoJson`); //filename
    },
    dialogConfirm() {
      if (this.nameType === "area") {
        this.$refs.mapDataDialog.show();
      } else {
        this.downloadAllJson();
      }
    },
    downloadAllJson() {
      //一次打包下载所有的数据
      this.showTips();
      if (this.downloadTips != "下载geoJson数据") {
        return;
      }
      this.codeList = [];

      this.downloadTips = "获取数据中...";

      //                this.district.setLevel('country'); //行政区级别
      this.district.setExtensions("all");
      console.log("开始递归循环获取地区code..");
      this.loopSearch("中国");
    },
    loopSearch(code) {
      if (this.loadedNode[code]) return console.warn("已加载过", code);
      this.waitToLoadList.push(code);
      this.loopSearchOnce();
    },
    loadingComplete() {
      this.isCodeListLoadComplete = true;
    },
    loopSearchOnce() {
      const pools = this.loadingThreads;
      const idle_thread = pools.findIndex((i) => !i);
      if (idle_thread === -1) return;
      const code = this.waitToLoadList.shift();
      if (!code) {
        const active_thread = pools.find((i) => i);
        if (!active_thread) return this.loadingComplete();
        return;
      }
      this.loadedNode[code] = true;
      pools[idle_thread] = new Promise((res, rej) => {
        this.district.search(code, (status, result) => {
          if (status !== "complete") {
            return rej(status);
          }
          console.log(
            `线程${idle_thread + 1}/${pools.length}:${code}--获取成功`
          );
          const item = result.districtList[0];
          const children = item.districtList;

          children &&
            children.map((i) => {
              const { name, adcode, level } = i;
              this.codeList.push({ name, adcode, level, code: adcode });
              if ("city|district|street".indexOf(i.level) === -1)
                this.loopSearch(i.adcode);
            });
          return res(code);
        });
      })
        .catch(() => {
          this.loadedNode[code] = false; // 重置为需要获取
          this.loopSearch(code);
        })
        .finally(() => {
          pools[idle_thread] = null; // 设置线程可用
          this.loopSearchOnce();
        });
    },
    loadAllGeoJson() {
      //通过codeList加载全部geoJson数据
      console.log("开始加载geoJson数据");
      AMapUI.loadUI(["geo/DistrictExplorer"], (DistrictExplorer) => {
        //创建一个实例
        var districtExplorer = (window.districtExplorer = new DistrictExplorer({
          eventSupport: true, //打开事件支持
          map: this.map,
        }));
        let mapJson = {};
        const list = this.codeList;
        const tasks = list.map(
          (i) =>
            new Promise((res, rej) => {
              districtExplorer.loadAreaNode(i.code, (error, areaNode) => {
                if (error) {
                  console.log(
                    `${i.name}--${i.code}，geo 数据获取失败，高德地图的锅^_^`
                  );
                  return res();
                }
                mapJson.type = "FeatureCollection";
                mapJson.features =
                  (areaNode && areaNode.getSubFeatures()) || "";
                console.log(
                  `${i.level}--${i.name}--${i.code}，geo 数据获取成功，马上为你打包`
                );
                if (i.level === "province") {
                  this.zip.file(
                    `100000/${i.code}.geoJson`,
                    JSON.stringify(mapJson)
                  );
                } else {
                  this.zip.file(
                    `100000/${i.code.substring(0, 2)}0000/${i.code}.geoJson`,
                    JSON.stringify(mapJson)
                  );
                }
                return res();
              });
            })
        );
        console.log("总文件个数：", tasks.length);
        let count = 1;
        tasks.forEach(async (task) => {
          await task;
          count++;
          if (count === tasks.length) {
            console.log("ziped");
            let readme = `\r\n项目源码github地址：https://github.com/TangSY/echarts-map-demo （欢迎star）\r\n个人空间：https://www.hxkj.vip （欢迎闲逛）\r\nEmail：t@tsy6.com  （遇到问题可以反馈）`;
            this.zip.file(`readMe(sourceCode).txt`, readme);
            this.downloadTips = "文件打包压缩中...";
            this.zip.generateAsync({ type: "blob" }).then((content) => {
              saveAs(content, "geoJson数据包.zip");
              this.downloadTips = "下载geoJson数据";
              this.isCodeListLoadComplete = false;
              this.$ba &&
                this.$ba.trackEvent("echartsMap", "文件下载", "打包下载成功");
            });
          }
        });
      });
    },
    loadMap(mapName, data) {
      if (data) {
        this.$echarts.registerMap(mapName, data);
        var option = {
          visualMap: {
            type: "piecewise",
            pieces: [
              { max: 30, label: "安全", color: "#2c9a42" },
              { min: 30, max: 60, label: "警告", color: "#d08a00" },
              { min: 60, label: "危险", color: "#c23c33" },
            ],
            color: "#fff",
            textStyle: {
              color: "#fff",
            },
            visibility: "off",
          },
          series: [
            {
              name: "数据名称",
              type: "map",
              roam: false,
              mapType: mapName,
              selectedMode: "single",
              showLegendSymbol: false,
              visibility: "off",
              itemStyle: {
                normal: {
                  color: "#ccc",
                  areaColor: "#fff",
                  borderColor: "#fff",
                  borderWidth: 0.5,
                  label: {
                    show: true,
                    textStyle: {
                      color: "rgb(249, 249, 249)",
                    },
                  },
                },
                emphasis: {
                  areaColor: false,
                  borderColor: "#fff",
                  areaStyle: {
                    color: "#fff",
                  },
                  label: {
                    show: true,
                    textStyle: {
                      color: "rgb(249, 249, 249)",
                    },
                  },
                },
              },
              data: this.mapData,
            },
          ],
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
            strokeColor: "#0091ea",
            fillColor: "#80d8ff",
            fillOpacity: 0.2,
            path: bounds[i],
          });
          this.polygons.push(polygon);
        }
        this.map.setFitView(); //地图自适应
      }

      //清空下一级别的下拉列表
      if (level === "province") {
        this.citySelect.innerHTML = "";
        this.districtSelect.innerHTML = "";
      } else if (level === "city") {
        this.districtSelect.innerHTML = "";
      }

      var subList = data.districtList;
      if (subList) {
        var contentSub = new Option("--请选择--");
        var curlevel = subList[0].level;
        if (curlevel === "street") {
          let mapJsonList = this.geoJsonData.features;
          let mapJson = {};
          for (let i in mapJsonList) {
            if (mapJsonList[i].properties.name == this.cityName) {
              mapJson.type = "FeatureCollection";
              mapJson.features = [].concat(mapJsonList[i]);
            }
          }
          this.mapData = [];
          this.mapData.push({
            name: this.cityName,
            value: Math.random() * 100,
            level: curlevel,
          });
          this.loadMap(this.cityName, mapJson);
          return;
        }

        var curList = document.querySelector("#" + curlevel);
        curList.add(contentSub);
        this.mapData = [];
        for (var i = 0, l = subList.length; i < l; i++) {
          var name = subList[i].name;
          var cityCode = subList[i].adcode;
          this.mapData.push({
            name: name,
            value: Math.random() * 100,
            cityCode: cityCode,
            level: curlevel,
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
      this.$ba &&
        this.$ba.trackEvent(
          "echartsMap",
          "筛选地图",
          `${this.cityName}-${this.cityCode}`
        );
      this.district.setLevel(option.value); //行政区级别
      this.district.setExtensions("all");
      //行政区查询
      //按照adcode进行查询可以保证数据返回的唯一性
      this.district.search(adcode, (status, result) => {
        if (status === "complete") {
          this.getData(result.districtList[0], obj.id, adcode);
        }
      });
    },
    // 联系下载乡镇数据
    contact() {
      this.$ba && this.$ba.trackEvent("echartsMap", "文件下载", "联系下载");
      if (/(iPhone|iPad|iPod|iOS|android)/i.test(navigator.userAgent)) {
        window.open(
          "mqqwpa://im/chat?chat_type=wpa&uin=2890228902&version=1&src_type=web&web_src=http:://wpa.b.qq.com"
        );
      } else {
        window.open(
          "http://wpa.qq.com/msgrd?v=3&uin=2890228902&site=在线客服&menu=yes"
        );
      }
    },
    openAd() {
      location.href = "https://map.hxkj.vip";
    },
  },
};
</script>

<style lang="stylus" scoped>
* {
  font-size: 14px;
}

.body {
  display: flex;
  width: 100%;
  overflow: hidden;
}

.map, .echarts {
  width: 0;
  flex: 1;
  overflow: hidden;
}

.echarts {
  background: url('./images/bg_bigdata.png') no-repeat;
  background-size: 100% 100%;
}

#map {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.tips {
  position: fixed;
  bottom: 30%;
  left: 40%;
  padding: 10px 15px;
  border-radius: 5px;
  color: #fff;
  background: rgba(0, 0, 0, 0.8);
  z-index: 999;
}

.gg {
  position: fixed;
  bottom: 0;
  left: 0;
  z-index: 999;
  cursor: pointer;
  width: 320px;

  img {
    width: 320px;
  }
}

.gg-close {
  position: absolute;
  top: 0;
  left: 0;
  width: 20px;
  height: 20px;
}

@keyframes adShakeAnmation {
  0% {
    bottom: 1px;
    left: 0px;
  }

  30% {
    bottom: 1;
    left: 10px;
  }

  70% {
    bottom: 0px;
    left: 1px;
  }

  100% {
    bottom: 0;
    left: 0;
  }
}
</style>
