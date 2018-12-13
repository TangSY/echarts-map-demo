/**
 * @Description:    自定义配置
 * @Author:         TSY
 * @CreateDate:     2018/6/9 13:28
 */

module.exports = {
    baseUrl: process.env.NODE_ENV === 'production' ? './' : '/',
    lintOnSave: false
}