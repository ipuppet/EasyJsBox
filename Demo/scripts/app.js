const { Kernel } = require("../EasyJsBox/src/kernel")

class AppKernel extends Kernel {
    constructor() {
        super()
        this.query = $context.query
        this.UIKit.disableLargeTitle()
        this.UIKit.setNavButtons([
            this.UIKit.navButton("setting", "gear", () => {
                this.UIKit.push({
                    title: $l10n("SETTING"),
                    views: this.setting.getView()
                })
            })
        ])
        // 注册组件
        this.settingComponent = this.registerComponent("setting")
        this.setting = this.settingComponent.controller
        this.initSettingMethods()
    }

    /**
     * 注入设置中的脚本类型方法
     */
    initSettingMethods() {
        this.setting.readme = animate => {
            animate.touchHighlight()
            const content = $file.read("/README.md").string
            this.UIKit.pushPageSheet({
                views: [{
                    type: "markdown",
                    props: { content: content },
                    layout: (make, view) => {
                        make.size.equalTo(view.super)
                    }
                }],
                title: $l10n("README")
            })
        }

        this.setting.tips = animate => {
            animate.touchHighlight()
            $ui.alert("Tips.")
        }
    }
}

module.exports = {
    run: () => {
        if ($app.env === $env.widget) {
            $widget.setTimeline({
                render: () => {
                    return {
                        type: "text",
                        props: {
                            text: "Widget"
                        }
                    }
                }
            })
        } else if ($app.env === $env.app) {
            const kernel = new AppKernel()
            const HomeUI = require("./ui/home")
            const interfaceUi = new HomeUI(kernel)
            kernel.UIRender(interfaceUi.getView())
        } else {
            $intents.finish("不支持在此环境中运行")
            $ui.render({
                views: [{
                    type: "label",
                    props: {
                        text: "不支持在此环境中运行",
                        align: $align.center
                    },
                    layout: (make, view) => {
                        make.center.equalTo(view.super)
                        make.size.equalTo(view.super)
                    }
                }]
            })
        }
    }
}