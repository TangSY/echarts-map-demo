/**
* @Description:
* @Author:         TSY
* @CreateDate:     2018/12/13 14:07
*/
<template>
    <div class="body">
        <div id="map"></div>
    </div>
</template>

<script>
    export default {
        name: "EchartsMap",
        data() {
            return {
                echartsMap: null
            }
        },
        mounted() {

        },
        computed: {

        },
        methods: {}
    }
</script>

<style lang="stylus" scoped>

    .body {
        width 100%
        background: url("./images/bg_bigdata.png") no-repeat
        background-size 100% 100%
    }

    #map {
        width 100%
        height 100vh
    }
</style>