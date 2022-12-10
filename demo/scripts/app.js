const { Kernel, Setting, Sheet, Toast } = require("./libs/easy-jsbox")

class AppKernel extends Kernel {
    constructor() {
        super()
        this.query = $context.query
        this.setting = new Setting()
        this.setting.loadConfig()
        this.initSettingMethods()
    }

    /**
     * 注入设置中的脚本类型方法
     */
    initSettingMethods() {
        /**
         * 脚本类型的动画
         * @typedef {object} ScriptAnimate
         * @property {Function} animate.start 会出现加载动画
         * @property {Function} animate.cancel 会直接恢复箭头图标
         * @property {Function} animate.done 会出现对号，然后恢复箭头
         * @property {Function} animate.touchHighlightStart 被点击的一行颜色加深
         * @property {Function} animate.touchHighlightEnd 被点击的一行颜色恢复
         * 
         * @type {ScriptAnimate} animate
         */
        this.setting.method.readme = animate => {
            const content = $file.read("/README.md").string
            const sheet = new Sheet()
            sheet
                .setView({
                    type: "markdown",
                    props: { content: content },
                    layout: (make, view) => {
                        make.size.equalTo(view.super)
                    }
                })
                .addNavBar($l10n("README"))
                .init()
                .present()
        }

        this.setting.method.tips = animate => {
            Toast.info("Tips.")
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
            const Factory = require("./ui/factory")
            new Factory(kernel).render()
        } else {
            $intents.finish("不支持在此环境中运行")
            $ui.render({
                views: [
                    {
                        type: "label",
                        props: {
                            text: "不支持在此环境中运行",
                            align: $align.center
                        },
                        layout: (make, view) => {
                            make.center.equalTo(view.super)
                            make.size.equalTo(view.super)
                        }
                    }
                ]
            })
        }
    }
}
