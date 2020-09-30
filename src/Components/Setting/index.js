const Controller = require("./controller")
const View = require("./view")

let controller = new Controller()
let view = new View(controller)

module.exports = {
    controller: controller,
    view: view,
    run: (settintPath = "/setting.json", savePath = "/assets/setting.json", info) => {
        controller.setPath(settintPath, savePath)
        controller.init()
        // 默认读取"/config.json"中的内容
        info = info ? info : JSON.parse($file.read("/config.json"))["info"]
        view.setInfo(info)
    }
}