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
            this.debug()
        }

        L10n.init()
    }

    static objectEqual(a, b) {
        let aProps = Object.getOwnPropertyNames(a)
        let bProps = Object.getOwnPropertyNames(b)
        if (aProps.length !== bProps.length) {
            return false
        }
        for (let i = 0; i < aProps.length; i++) {
            let propName = aProps[i]

            let propA = a[propName]
            let propB = b[propName]
            if (Array.isArray(propA)) {
                for (let i = 0; i < propA.length; i++) {
                    if (!Kernel.objectEqual(propA[i], propB[i])) {
                        return false
                    }
                }
            } else if (typeof propA === "object") {
                return Kernel.objectEqual(propA, propB)
            } else if (propA !== propB) {
                return false
            }
        }
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

    debug(print, error) {
        this.debugMode = true
        $app.idleTimerDisabled = true
        if (typeof print === "function") {
            this.debugPrint = print
        }
        if (typeof error === "function") {
            this.debugError = error
        }
        this.print("You are running EasyJsBox in debug mode.")
    }

    print(message) {
        if (!this.debugMode) return
        if (typeof this.debugPrint === "function") {
            this.debugPrint(message)
        } else {
            console.log(message)
        }
    }

    error(error) {
        if (!this.debugMode) return
        if (typeof this.debugError === "function") {
            this.debugError(error)
        } else {
            console.error(error)
        }
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

        $ui.render({ events: view.events ?? {} })

        $delay(0, () => {
            $ui.controller.view = $ui.create(view)
            $ui.controller.view.layout(view.layout)
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
