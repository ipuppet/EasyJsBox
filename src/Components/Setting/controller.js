const BaseController = require("../../Foundation/controller")

class Controller extends BaseController {
    init(args) {
        this.path = args.savePath ? args.savePath : "/assets/setting.json"
        this._setName(args.savePath.replace("/", "-"))
        if (args.struct) {
            this.struct = args.struct
        } else {
            if (!args.structPath) args.structPath = "/setting.json"
            this.struct = JSON.parse($file.read(args.structPath).string)
        }
        this._loadConfig()
        // 从"/config.json"中读取内容
        this.view.setInfo(JSON.parse($file.read("/config.json").string)["info"])
        // 是否全屏显示
        this.dataCenter.set("secondaryPage", false)
        // 注册调色板插件
        if (typeof $picker.color !== "function")
            this.kernel.registerPlugin("palette")
        return this
    }

    /**
     * 设置一个独一无二的名字
     * @param {String} name 名字
     */
    _setName(name) {
        this.dataCenter.set("name", name)
    }

    _loadConfig() {
        this.setting = {}
        let user = {}
        if ($file.exists(this.path)) {
            user = JSON.parse($file.read(this.path).string)
        }
        for (let section of this.struct) {
            for (let item of section.items) {
                this.setting[item.key] = item.key in user ? user[item.key] : item.value
            }
        }
    }

    /**
     * 是否是二级页面
     * @param {Boolean} secondaryPage 
     */
    isSecondaryPage(secondaryPage, pop) {
        this.dataCenter.set("secondaryPage", secondaryPage)
        if (secondaryPage)
            this.dataCenter.set("pop", pop)
    }

    setFooter(footer) {
        this.dataCenter.set("footer", footer)
    }

    get(key) {
        return this.setting[key]
    }

    /**
     * 设置一个钩子，在set方法调用时触发
     * @param {CallableFunction} hook 
     */
    setHook(hook) {
        this.hook = hook
    }

    set(key, value) {
        this.setting[key] = value
        $file.write({
            data: $data({ string: JSON.stringify(this.setting) }),
            path: this.path
        })
        if (this.hook) this.hook(key, value)
        return true
    }
}

module.exports = Controller