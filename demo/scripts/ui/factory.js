const { TabBarController } = require("../libs/easy-jsbox")

class Factory {
    constructor(kernel) {
        this.kernel = kernel
        this.tabBarController = new TabBarController()
    }

    home() {
        const InterfaceUI = require("./home")
        const interfaceUi = new InterfaceUI(this.kernel)
        return interfaceUi.getPage()
    }

    list() {
        const InterfaceUI = require("./list")
        const interfaceUi = new InterfaceUI(this.kernel)
        return interfaceUi.getPage()
    }

    setting() {
        return this.kernel.setting.getPage()
    }

    /**
     * 渲染页面
     */
    render() {
        this.tabBarController
            .setPages({
                home: this.home(),
                list: this.list(),
                setting: this.setting()
            })
            .setCells({
                home: {
                    icon: ["house", "house.fill"],
                    title: $l10n("HOME")
                },
                list: {
                    icon: "doc.plaintext",
                    title: $l10n("LIST")
                },
                setting: {
                    icon: "gear",
                    title: $l10n("SETTING")
                }
            })
        this.kernel.UIRender(this.tabBarController.generateView().definition)
    }
}

module.exports = Factory
