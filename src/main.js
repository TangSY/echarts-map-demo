import Vue from 'vue'
import App from './App.vue'
import axios from 'axios'
import Qs from 'qs'
import {Toast, Indicator} from 'mint-ui'
import echarts from 'echarts'
import VueJsonp from 'vue-jsonp'

Vue.use(VueJsonp)

Vue.config.productionTip = false
Vue.prototype.$echarts = echarts
Vue.prototype.$toast = Toast;
Vue.prototype.$bottomToast = (msg) => {
    Toast({position: 'bottom', message: msg})
}
Vue.prototype.$indicator = Indicator;
Vue.prototype.$axios = (method, url, params, callback) => {
    Indicator.open();
    axios({
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        method: method || 'post',
        url: url,
        data: Qs.stringify(params),
        withCredentials: true
    }).then(function (data) {
        Indicator.close();
        callback(data.data)
    }).catch(function (err) {
        Indicator.close();
        console.log(err);
        Toast({position: 'bottom', message: '网络错误，请稍后再试！'})
    })
};

//jsonp跨域请求
Vue.prototype.http = (_this, url, params, callback, isShowIndicator = true) => {
    if (isShowIndicator) {
        Indicator.open();
    }
    let paramsPre = {
        'jsonp': "callback",
        'jsonpCallback': "success_jsonpCallback",
        'platform': 'wap'
    }
    params = Object.assign(paramsPre, params);
    _this.$jsonp(url, params).then(json => {
        if (isShowIndicator) {
            Indicator.close();
        }
        callback(json);
    }).catch(err => {
        if (isShowIndicator) {
            Indicator.close();
        }
        console.log(err);
        Toast({position: 'bottom', message: '网络错误，请稍后再试！'});
    })
}

new Vue({
  render: h => h(App)
}).$mount('#app')
