const BaseController = require("../../Foundation/controller")

class Controller extends BaseController {
    /**
     * 设置切换菜单时的回调函数
     * @param {*} callback 回调函数
     */
    setCallback(callback) {
        this.callback = callback
    }
}

module.exports = Controller