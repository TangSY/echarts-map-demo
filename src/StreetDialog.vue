/**
* @Description:    全国乡镇数据获取
* @Author:         TSY 
* @Email:          t@tsy6.com
* @CreateDate:     2020/07/07 01:02
*/
<template>
  <div class="dialog"
       v-show="isShowDialog">
    <div class="dialog-content">
      <div class="dialog-title">全国乡镇数据获取</div>
      <div class="dialog-close"
           @click="closeDialog">&times;</div>
      <div class="dialog-concat">
        <p>邮箱：2890228902@qq.com</p>
        <p>QQ：2890228902</p>
      </div>
      <div class="dialog-bottom">
        <div class="dialog-btn dialog-cancel"
             @click="demo">查看示例数据</div>
      </div>
      <div class="dialog-btn dialog-cancel"
           @click="contact">点此咨询</div>
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