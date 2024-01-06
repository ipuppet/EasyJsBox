const { VERSION } = require("./version")
const { UIKit } = require("./ui-kit")
const { L10n } = require("./l10n")

class Kernel {
    startTime = Date.now()
    // 隐藏 jsbox 默认 nav 栏
    isUseJsboxNav = false
    title = $addin?.current?.name

    constructor() {
        if ($app.isDebugging) {
            console.log("You are running EasyJsBox in debug mode.")
            $app.idleTimerDisabled = true
        }

        L10n.init()
    }

    static isObject(object) {
        return object != null && typeof object === "object"
    }

    static objectEqual(obj1, obj2) {
        // 获取对象的属性名
        const keys1 = Object.keys(obj1)
        const keys2 = Object.keys(obj2)

        // 检查属性名的长度是否相等
        if (keys1.length !== keys2.length) {
            return false
        }

        // 排序是为了优化性能，可以快速发现不匹配的属性
        keys1.sort()
        keys2.sort()

        // 检查排序后的属性名是否一一对应
        for (let i = 0; i < keys1.length; i++) {
            if (keys1[i] !== keys2[i]) {
                return false
            }
        }

        // 深度比较每个属性的值
        for (let key of keys1) {
            const val1 = obj1[key]
            const val2 = obj2[key]

            // 检查属性值是否是对象，如果是，则递归比较
            const areObjects = Kernel.isObject(val1) && Kernel.isObject(val2)
            if ((areObjects && !Kernel.objectEqual(val1, val2)) || (!areObjects && val1 !== val2)) {
                return false
            }
        }

        // 如果所有检查都通过，则两个对象相等
        return true
    }

    /**
     * 对比版本号
     * @param {string} preVersion
     * @param {string} lastVersion
     * @returns {number} 1: preVersion 大, 0: 相等, -1: lastVersion 大
     */
    static versionCompare(preVersion = "", lastVersion = "") {
        let sources = preVersion.split(".")
        let dests = lastVersion.split(".")
        let maxL = Math.max(sources.length, dests.length)
        let result = 0
        for (let i = 0; i < maxL; ++i) {
            let preValue = sources.length > i ? sources[i] : 0
            let preNum = isNaN(Number(preValue)) ? preValue.charCodeAt() : Number(preValue)
            let lastValue = dests.length > i ? dests[i] : 0
            let lastNum = isNaN(Number(lastValue)) ? lastValue.charCodeAt() : Number(lastValue)
            if (preNum < lastNum) {
                result = -1
                break
            } else if (preNum > lastNum) {
                result = 1
                break
            }
        }
        return result
    }

    useJsboxNav() {
        this.isUseJsboxNav = true
        return this
    }

    setTitle(title) {
        if (this.isUseJsboxNav) {
            $ui.title = title
        }
        this.title = title
    }

    setNavButtons(buttons) {
        this.navButtons = buttons
    }

    /**
     * 在 JSBox 主程序打开自己，用于键盘等其他环境
     */
    openInJsbox() {
        $app.openURL(`jsbox://run?name=${this.title}`)
    }

    UIRender(view = {}) {
        const query = $context.query
        if (query.type === "alertFromKeyboard") {
            const object = JSON.parse($text.URLDecode(query.value))
            object.actions = [{ title: $l10n("CANCEL") }]
            $ui.alert(object)
            return
        }
        try {
            view.props = Object.assign(
                {
                    title: this.title,
                    navBarHidden: !this.isUseJsboxNav,
                    navButtons: this.navButtons ?? [],
                    statusBarStyle: 0
                },
                view.props
            )
            if (!view.events) {
                view.events = {}
            }
            const oldLayoutSubviews = view.events.layoutSubviews
            view.events.layoutSubviews = () => {
                $app.notify({
                    name: "interfaceOrientationEvent",
                    object: {
                        statusBarOrientation: UIKit.statusBarOrientation,
                        isHorizontal: UIKit.isHorizontal
                    }
                })
                if (typeof oldLayoutSubviews === "function") oldLayoutSubviews()
            }
            $ui.render(view)
        } catch (error) {
            this.print(error)
        }
    }

    KeyboardRender(view = {}) {
        if (!view.id) view.id = $text.uuid

        $ui.render()

        $delay(0, () => {
            $ui.controller.view = $ui.create(view)
            $ui.controller.view.layout(view.layout)
        })
    }
    KeyboardRenderWithViewFunc(getView) {
        $ui.render()
        $delay(0, () => {
            $ui.controller.view = $ui.create({ type: "view" })
            $delay(0, async () => {
                const view = await getView()
                if (!view.id) view.id = $text.uuid
                $ui.controller.view = $ui.create(view)
                $ui.controller.view.layout(view.layout)
            })
        })
    }

    async checkUpdate() {
        const branche = "dev" // 更新版本，可选 master, dev
        const configRes = await $http.get(
            `https://raw.githubusercontent.com/ipuppet/EasyJsBox/${branche}/src/version.js`
        )
        if (configRes.error) {
            throw configRes.error
        }

        const latestVersion = configRes.data.match(/.*VERSION.+\"([0-9\.]+)\"/)[1]

        this.print(`easy-jsbox latest version: ${latestVersion}`)
        if (Kernel.versionCompare(latestVersion, VERSION) > 0) {
            const srcRes = await $http.get(
                `https://raw.githubusercontent.com/ipuppet/EasyJsBox/${branche}/dist/easy-jsbox.js`
            )
            if (srcRes.error) {
                throw srcRes.error
            }

            return srcRes.data
        }

        return false
    }
}

module.exports = {
    Kernel
}
