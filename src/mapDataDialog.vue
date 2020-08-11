<!--
 * @Description: 
 * @Author: TSY
 * @Date: 2020-08-11 23:40:43
 * @LastEditTime: 2020-08-11 23:52:02
-->
/**
* @Description:    全国乡镇级联数据
* @Author:         TSY 
* @Email:          t@tsy6.com
* @CreateDate:     2020/08/07 01:02
*/
<template>
  <div class="dialog"
       v-show="isShowDialog">
    <div class="dialog-content">
      <table>
        <thead>
          <tr>
            <th align="left">单级数据文件列表</th>
            <th align="left">JSON</th>
            <th align="left">CSV</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td align="left">省级（省份、直辖市、自治区）</td>
            <td align="left"><a href="https://hxkj.vip/demo/mapData/provinces.json">provinces.json</a></td>
            <td align="left"><a href="https://hxkj.vip/demo/mapData/provinces.csv">provinces.csv</a></td>
          </tr>
          <tr>
            <td align="left">地级（城市）</td>
            <td align="left"><a href="https://hxkj.vip/demo/mapData/cities.json">cities.json</a></td>
            <td align="left"><a href="https://hxkj.vip/demo/mapData/cities.csv">cities.csv</a></td>
          </tr>
          <tr>
            <td align="left">县级（区县）</td>
            <td align="left"><a href="https://hxkj.vip/demo/mapData/areas.json">areas.json</a></td>
            <td align="left"><a href="https://hxkj.vip/demo/mapData/areas.csv">areas.csv</a></td>
          </tr>
          <tr>
            <td align="left">乡级（乡镇、街道）</td>
            <td align="left"><a href="https://hxkj.vip/demo/mapData/streets.json">streets.json</a></td>
            <td align="left"><a href="https://hxkj.vip/demo/mapData/streets.csv">streets.csv</a></td>
          </tr>
          <tr>
            <td align="left">村级（村委会、居委会）</td>
            <td align="left"><a href="https://hxkj.vip/demo/mapData/villages.json">villages.json</a></td>
            <td align="left"><a href="https://hxkj.vip/demo/mapData/villages.csv">villages.csv</a></td>
          </tr>
        </tbody>
      </table>
      <table>
        <thead>
          <tr>
            <th align="left">联动数据文件列表</th>
            <th align="left">普通</th>
            <th align="left">带编码</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td align="left">“省份、城市” 二级联动数据</td>
            <td align="left"><a href="https://hxkj.vip/demo/mapData/pc.json">pc.json</a></td>
            <td align="left"><a href="https://hxkj.vip/demo/mapData/pc-code.json">pc-code.json</a></td>
          </tr>
          <tr>
            <td align="left">“省份、城市、区县” 三级联动数据</td>
            <td align="left"><a href="https://hxkj.vip/demo/mapData/pca.json">pca.json</a></td>
            <td align="left"><a href="https://hxkj.vip/demo/mapData/pca-code.json">pca-code.json</a></td>
          </tr>
          <tr>
            <td align="left">“省份、城市、区县、乡镇” 四级联动数据</td>
            <td align="left"><a href="https://hxkj.vip/demo/mapData/pcas.json">pcas.json</a></td>
            <td align="left"><a href="https://hxkj.vip/demo/mapData/pcas-code.json">pcas-code.json</a></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
export default {
  name: "streetDialog",
  data() {
    return {
      isShowDialog: false,//是否显示打赏弹窗
    }
  },
  mounted() {

  },
  computed: {},
  methods: {
    demo() {
      window.location.href = "https://hxkj.vip/demo/streetMap/index.html"
    },
    closeDialog() {
      this.isShowDialog = false;
    },
    contact() {
      this.$emit('confirm')
      this.isShowDialog = false;
    },
    show() {
      this.isShowDialog = true;
    }
  }
}
</script>

<style lang="stylus" scoped>
.dialog
  position fixed
  top 0px
  left 0px
  width 100%
  height 100%
  display flex
  align-items center
  justify-content center
  background rgba(0, 0, 0, 0.3)
  z-index 999
.dialog-content
  position relative
  width 600px
  display flex
  align-items center
  flex-direction column
  background #17c1fb
  padding 30px
  border-radius 10px
  color #fff
.dialog-title
  font-size 24px
  margin-bottom 15px
.dialog-close
  font-size 26px
  position absolute
  right 20px
  top 0px
  cursor pointer
.dialog-img
  width 100%
  display flex
  align-items center
  justify-content space-around
.dialog-img img
  width 250px
  height 350px
.dialog-bottom
  width 100%
  margin-top 40px
  display flex
  align-items center
  justify-content space-around
.dialog-btn
  position relative
  padding 10px 20px
  background #1c71fb
  margin-bottom 15px
  border-radius 5px
  cursor pointer
</style>