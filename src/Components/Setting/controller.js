const BaseController = require("../../Foundation/controller")

class Controller extends BaseController {
    init(settintPath = "/setting.json", savePath = "/assets/setting.json", info) {
        this.setPath(settintPath, savePath)
        this.loadConfig()
        // 默认读取"/config.json"中的内容
        info = info ? info : JSON.parse($file.read("/config.json"))["info"]
        this.view.setInfo(info)
        return this
    }
    
    loadConfig() {
        this.setting = {}
        let user = {}
        if ($file.exists(this.path)) {
            user = JSON.parse($file.read(this.path))
        }
        for (let section of this.struct) {
            for (let item of section.items) {
                this.setting[item.key] = item.key in user ? user[item.key] : item.value
            }
        }
    }

    setPath(settintPath, savePath) {
        this.path = savePath
        this.struct = JSON.parse($file.read(settintPath))
    }

    get(key) {
        return this.setting[key]
    }

    set(key, value) {
        this.setting[key] = value
        $file.write({
            data: $data({ string: JSON.stringify(this.setting) }),
            path: this.path
        })
        return true
    }
}

module.exports = Controller