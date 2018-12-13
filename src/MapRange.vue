/**
* @Description:
* @Author:         TSY
* @CreateDate:     2018/12/13 14:06
*/
<template>
    <div class="body">
        <div id="container"></div>

        <div class="input-card">
            <h4>下属行政区查询</h4>
            <div class="input-item">
                <div class="input-item-prepend"><span class="input-item-text">省市区</span></div>
                <select id='province' style="width:100px" @change='search("province")'></select>
            </div>
            <div class="input-item">
                <div class="input-item-prepend"><span class="input-item-text">地级市</span></div>
                <select id='city' style="width:100px" @change='search("city")'></select>
            </div>
            <div class="input-item">
                <div class="input-item-prepend"><span class="input-item-text">区县</span></div>
                <select id='district' style="width:100px" @change='search("district")'></select>
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        name: "MapRange",
        data() {
            return {

            }
        },
        mounted() {

        },
        computed: {},
        methods: {
            search(area){
                this.$emit('change',area)
            }
        }
    }
</script>

<style lang="stylus" scoped>
    @import "https://a.amap.com/jsapi_demos/static/demo-center/css/demo-center.css"

    html,body,#container{
        width 100%
        height 100vh;
    }

    #container{
        width:100%;
    }

    .body {
        height 100vh;
    }

    .input-card {
        position fixed
        top 10px
        left 10px
        height 160px
    }
</style>