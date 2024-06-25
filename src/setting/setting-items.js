const { FileStorageFileNotFoundError } = require("../file-storage")
const { UIKit } = require("../ui-kit")
const { Sheet } = require("../sheet")
const { NavigationView } = require("../navigation-view/navigation-view")
const { NavigationBar } = require("../navigation-view/navigation-bar")

/**
 * @typedef {import("./setting").Setting} Setting
 *
 * 脚本类型的动画
 * @typedef {object} ScriptAnimate
 * @property {Function} animate.start
 * @property {Function} animate.cancel
 * @property {Function} animate.done
 * @property {Function} animate.touchHighlightStart
 * @property {Function} animate.touchHighlightEnd
 *
 * 用于存放 script 类型用到的方法
 * @callback SettingMethodFunction
 * @param {ScriptAnimate} animate
 *
 * @typedef {object} SettingMethod
 * @property {SettingMethodFunction} *
 */

class SettingItem {
    static rowHeight = 50
    static edgeOffset = 10
    static iconSize = 30
    static iconDefaultColor = "#00CC00"

    /**
     * @type {Setting}
     */
    setting
    #id
    #key
    #icon
    title
    #options = {}
    #onSet

    constructor({ setting, key, title, icon, value = null } = {}) {
        this.setting = setting
        this.key = key
        this.title = $l10n(title)
        this.icon = icon
        this.default = value
    }

    get method() {
        return this.setting.method
    }

    set key(key) {
        this.#key = key ?? $text.uuid
        this.#id = undefined
        return this
    }
    get key() {
        return this.#key
    }

    get id() {
        if (!this.#id) {
            this.#id = `setting-${$text.uuid}-${this.key}`
        }
        return this.#id
    }

    set icon(icon) {
        if (!icon) icon = ["square.grid.2x2.fill", SettingItem.iconDefaultColor]
        else if (!Array.isArray(icon)) icon = [icon, SettingItem.iconDefaultColor]

        // `icon[0]` symbol or image
        // if `icon[0]` is array, light and dark mode
        if (!Array.isArray(icon[0])) {
            icon[0] = [icon[0], icon[0]]
        }
        // `icon[1]` color
        // if `icon[0]` is array, same as `icon[0]`
        if (!icon[1]) {
            icon[1] = [SettingItem.iconDefaultColor, SettingItem.iconDefaultColor]
        } else if (!Array.isArray(icon[1])) {
            icon[1] = [icon[1], icon[1]]
        }

        this.#icon = icon
        return this
    }
    get icon() {
        return this.#icon
    }

    get options() {
        return this.#options
    }
    set options(options) {
        this.#options = options ?? {}
        return this
    }

    set(value) {
        if (typeof this.#onSet === "function") this.#onSet(value)
        return this.setting.set(this.key, value)
    }

    onSet(func) {
        this.#onSet = func
        return this
    }

    get(_default = this.default) {
        return this.setting.getOriginal(this.key, _default)
    }

    evalValues(object, _default = []) {
        let result
        if (typeof object === "string") {
            if (object.startsWith("this.method")) {
                result = new Function("method", `return ${object.replace("this.", "")}()`)(this.method)
                //result = $addin.eval(`(()=>{return ${object}()})()`)
            } else {
                result = new Function(`return {${object}}`)()
                //result = $addin.eval(`(()=>{return ${object}})()`)
            }
        } else if (typeof object === "function") {
            result = object()
        } else {
            result = object ?? _default
        }
        return result
    }

    createLineLabel() {
        return {
            type: "view",
            views: [
                {
                    // icon
                    type: "view",
                    props: {
                        bgcolor: $color(this.icon[1][0], this.icon[1][1]),
                        cornerRadius: 5,
                        smoothCorners: true
                    },
                    views: [
                        {
                            type: "image",
                            props: {
                                tintColor: $color("white"),
                                image: $image(this.icon[0][0], this.icon[0][1])
                            },
                            layout: (make, view) => {
                                make.center.equalTo(view.super)
                                make.size.equalTo(20)
                            }
                        }
                    ],
                    layout: (make, view) => {
                        make.centerY.equalTo(view.super)
                        make.size.equalTo(SettingItem.iconSize)
                        make.left.inset(SettingItem.edgeOffset)
                    }
                },
                {
                    // title
                    type: "label",
                    props: {
                        text: this.title,
                        lines: 1,
                        align: $align.left
                    },
                    layout: (make, view) => {
                        make.centerY.equalTo(view.super)
                        make.height.equalTo(view.super)
                        make.left.equalTo(view.prev.right).offset(SettingItem.edgeOffset)
                        make.width.greaterThanOrEqualTo(10)
                    }
                }
            ],
            layout: (make, view) => {
                make.height.centerY.equalTo(view.super)
                make.left.inset(0)
            }
        }
    }

    getView() {}

    create() {
        return this.getView(this.options)
    }
}

class SettingInfo extends SettingItem {
    get isArray() {
        return Array.isArray(this.default)
    }

    async tapped() {
        const moreInfo = this.isArray ? this.default[1] : this.default
        const result = await $ui.alert({
            title: this.title,
            message: moreInfo,
            actions: [{ title: $l10n("COPY") }, { title: $l10n("OK") }]
        })
        if (result.index === 0) {
            $clipboard.text = moreInfo
            $ui.toast($l10n("COPIED"))
        }
    }

    getView() {
        return {
            type: "view",
            props: { selectable: true, info: { key: this.key } },
            views: [
                this.createLineLabel(),
                {
                    type: "label",
                    props: {
                        text: this.isArray ? this.default[0] : this.default,
                        align: $align.right,
                        textColor: $color("darkGray")
                    },
                    layout: (make, view) => {
                        make.centerY.equalTo(view.prev)
                        make.right.inset(SettingItem.edgeOffset)
                        make.width.equalTo(180)
                    }
                }
            ],
            layout: $layout.fill
        }
    }
}

class SettingSwitch extends SettingItem {
    getView() {
        return {
            type: "view",
            props: { id: this.id, selectable: true },
            views: [
                this.createLineLabel(),
                {
                    type: "switch",
                    props: {
                        on: this.get(),
                        onColor: $color("#00CC00")
                    },
                    events: {
                        changed: sender => {
                            try {
                                this.set(sender.on)
                            } catch (error) {
                                // 恢复开关状态
                                sender.on = !sender.on
                                throw error
                            }
                        }
                    },
                    layout: (make, view) => {
                        make.centerY.equalTo(view.prev)
                        make.right.inset(SettingItem.edgeOffset)
                    }
                }
            ],
            layout: $layout.fill
        }
    }
}

class SettingString extends SettingItem {
    getView() {
        return {
            type: "view",
            props: { id: this.id, selectable: true },
            views: [
                this.createLineLabel(),
                {
                    type: "button",
                    props: {
                        symbol: "square.and.pencil",
                        bgcolor: $color("clear"),
                        tintColor: $color("primaryText")
                    },
                    events: {
                        tapped: sender => {
                            const popover = $ui.popover({
                                sourceView: sender,
                                sourceRect: sender.bounds,
                                directions: $popoverDirection.down,
                                size: $size(320, 150),
                                views: [
                                    {
                                        type: "text",
                                        props: {
                                            id: `${this.id}-string`,
                                            align: $align.left,
                                            text: this.get()
                                        },
                                        layout: make => {
                                            make.left.right.inset(10)
                                            make.top.inset(20)
                                            make.height.equalTo(90)
                                        }
                                    },
                                    {
                                        type: "button",
                                        props: {
                                            symbol: "checkmark",
                                            bgcolor: $color("clear"),
                                            titleEdgeInsets: 10,
                                            contentEdgeInsets: 0
                                        },
                                        layout: make => {
                                            make.right.inset(10)
                                            make.bottom.inset(25)
                                            make.size.equalTo(30)
                                        },
                                        events: {
                                            tapped: () => {
                                                this.set($(`${this.id}-string`).text)
                                                popover.dismiss()
                                            }
                                        }
                                    }
                                ]
                            })
                        }
                    },
                    layout: (make, view) => {
                        make.centerY.equalTo(view.prev)
                        make.right.inset(0)
                        make.size.equalTo(50)
                    }
                }
            ],
            layout: $layout.fill
        }
    }
}

class SettingStepper extends SettingItem {
    with({ min, max } = {}) {
        this.options = { min, max }
        return this
    }

    getView({ min, max } = {}) {
        const labelId = `${this.id}-label`
        return {
            type: "view",
            props: { id: this.id, selectable: true },
            views: [
                this.createLineLabel(),
                {
                    type: "label",
                    props: {
                        id: labelId,
                        text: this.get(),
                        align: $align.left
                    },
                    layout: (make, view) => {
                        make.height.equalTo(view.super)
                        make.right.inset(120)
                    }
                },
                {
                    type: "stepper",
                    props: {
                        min: min,
                        max: max,
                        value: this.get()
                    },
                    events: {
                        changed: sender => {
                            $(labelId).text = sender.value
                            try {
                                this.set(sender.value)
                            } catch (error) {
                                // 恢复标签显示数据
                                $(labelId).text = this.get()
                                throw error
                            }
                        }
                    },
                    layout: (make, view) => {
                        make.centerY.equalTo(view.prev)
                        make.right.inset(SettingItem.edgeOffset)
                    }
                }
            ],
            layout: $layout.fill
        }
    }
}

class SettingScript extends SettingItem {
    rightSymbol = "chevron.right"
    buttonId = `${this.id}-button`

    start() {
        // 隐藏 button，显示 spinner
        $(this.buttonId).alpha = 0
        $(`${this.buttonId}-spinner`).alpha = 1
    }
    cancel() {
        $(this.buttonId).alpha = 1
        $(`${this.buttonId}-spinner`).alpha = 0
    }
    done() {
        $(`${this.buttonId}-spinner`).alpha = 0
        const button = $(this.buttonId)
        // 成功动画
        button.symbol = "checkmark"
        $ui.animate({
            duration: 0.6,
            animation: () => (button.alpha = 1),
            completion: () => {
                $ui.animate({
                    duration: 0.4,
                    animation: () => (button.alpha = 0),
                    completion: () => {
                        button.symbol = this.rightSymbol
                        $ui.animate({
                            duration: 0.4,
                            animation: () => (button.alpha = 1)
                        })
                    }
                })
            }
        })
    }

    with({ script } = {}) {
        this.options = { script }
        return this
    }

    async tapped() {
        /**
         * @type {ScriptAnimate}
         */
        const animate = {
            start: () => this.start(), // 会出现加载动画
            cancel: () => this.cancel(), // 会直接恢复箭头图标
            done: () => this.done() // 会出现对号，然后恢复箭头
        }
        // 执行代码
        const { script } = this.options
        if (typeof script === "function") {
            await script(animate)
        } else if (script.startsWith("this.method")) {
            const scriptToFunction = new Function(
                "method",
                "animate",
                `return async()=>{await ${script.replace("this.", "")}(animate)}`
            )(this.method, animate)
            await scriptToFunction()
        } else {
            const scriptToFunction = new Function("animate", `return async()=>{${script}}`)(animate)
            await scriptToFunction()
        }
    }

    getView() {
        const rightSymbol = "chevron.right"
        return {
            type: "view",
            props: { id: this.id, selectable: true, info: { key: this.key } },
            views: [
                this.createLineLabel(),
                {
                    type: "view",
                    views: [
                        {
                            // 仅用于显示图片
                            type: "button",
                            props: {
                                id: this.buttonId,
                                symbol: rightSymbol,
                                bgcolor: $color("clear"),
                                tintColor: $color("secondaryText")
                            },
                            events: { tapped: () => this.tapped() },
                            layout: (make, view) => {
                                make.centerY.equalTo(view.super)
                                make.right.inset(0)
                                make.height.equalTo(view.super)
                            }
                        },
                        {
                            type: "spinner",
                            props: {
                                id: `${this.buttonId}-spinner`,
                                loading: true,
                                alpha: 0 // 透明度用于渐变完成动画
                            },
                            layout: (make, view) => {
                                make.size.equalTo(15)
                                make.centerY.equalTo(view.super)
                                make.right.equalTo(view.prev)
                            }
                        }
                    ],
                    layout: (make, view) => {
                        make.right.inset(SettingItem.edgeOffset)
                        make.height.equalTo(SettingItem.rowHeight)
                        make.width.equalTo(view.super)
                    }
                }
            ],
            layout: $layout.fill
        }
    }
}

class SettingTab extends SettingItem {
    with({ items, values } = {}) {
        if (Array.isArray(items)) items = items.map(item => $l10n(item))
        this.options = { items, values }
        return this
    }

    getView({ items, values } = {}) {
        items = this.evalValues(items)
        values = this.evalValues(values)

        const isCustomizeValues = items?.length > 0 && values?.length === items?.length
        return {
            type: "view",
            props: { id: this.id, selectable: true },
            views: [
                this.createLineLabel(),
                {
                    type: "tab",
                    props: {
                        items: items ?? [],
                        index: isCustomizeValues ? values.indexOf(this.get()) : this.get(),
                        dynamicWidth: true
                    },
                    layout: (make, view) => {
                        make.right.inset(SettingItem.edgeOffset)
                        make.centerY.equalTo(view.prev)
                    },
                    events: {
                        changed: sender => {
                            if (isCustomizeValues) {
                                this.set(values[sender.index])
                            } else {
                                this.set(sender.index)
                            }
                        }
                    }
                }
            ],
            layout: $layout.fill
        }
    }
}

class SettingMenu extends SettingItem {
    with({ items, values, pullDown } = {}) {
        if (Array.isArray(items)) items = items.map(item => $l10n(item))
        this.options = { items, values, pullDown }
        return this
    }

    getView({ items, values, pullDown } = {}) {
        const labelId = `${this.id}-label`

        const tmpItems = this.evalValues(items)
        const tmpValues = this.evalValues(values)

        const isCustomizeValues = tmpItems?.length > 0 && tmpValues?.length === tmpItems?.length

        const handler = (title, idx) => {
            if (isCustomizeValues) {
                const tmpValues = this.evalValues(values)
                this.set(tmpValues[idx])
            } else {
                this.set(idx)
            }
            $(labelId).title = title
        }
        const tapped = () => {
            if (pullDown) return

            $ui.menu({
                items: this.evalValues(items),
                handler
            })
        }

        return {
            type: "view",
            props: { id: this.id, selectable: true },
            views: [
                this.createLineLabel(),
                {
                    type: "view",
                    views: [
                        {
                            type: "button",
                            props: {
                                menu: pullDown
                                    ? {
                                          pullDown: true,
                                          asPrimary: true,
                                          items: tmpItems.map((title, idx) => {
                                              return {
                                                  title: title,
                                                  handler: () => handler(title, idx)
                                              }
                                          })
                                      }
                                    : undefined,
                                title: isCustomizeValues
                                    ? tmpItems[tmpValues.indexOf(this.get())]
                                    : tmpItems[this.get()],
                                titleColor: $color("secondaryText"),
                                bgcolor: $color("clear"),
                                id: labelId
                            },
                            events: { tapped },
                            layout: (make, view) => {
                                make.right.inset(0)
                                make.height.equalTo(view.super)
                            }
                        }
                    ],
                    layout: (make, view) => {
                        make.right.inset(SettingItem.edgeOffset)
                        make.height.equalTo(SettingItem.rowHeight)
                        make.width.equalTo(view.super)
                    }
                }
            ],
            layout: $layout.fill
        }
    }
}

class SettingColor extends SettingItem {
    get(_default = null) {
        const color = super.get(_default)
        if (!color) return _default
        return typeof color === "string" ? $color(color) : $rgba(color.red, color.green, color.blue, color.alpha)
    }

    getView() {
        const colorId = `${this.id}-color`
        return {
            type: "view",
            props: { id: this.id, selectable: true },
            views: [
                this.createLineLabel(),
                {
                    type: "view",
                    views: [
                        {
                            // 颜色预览以及按钮功能
                            type: "view",
                            props: {
                                id: colorId,
                                bgcolor: this.get(),
                                circular: true,
                                borderWidth: 1,
                                borderColor: $color("#e3e3e3")
                            },
                            layout: (make, view) => {
                                make.centerY.equalTo(view.super)
                                make.right.inset(SettingItem.edgeOffset)
                                make.size.equalTo(20)
                            }
                        },
                        {
                            // 用来监听点击事件，增大可点击面积
                            type: "view",
                            events: {
                                tapped: async () => {
                                    const color = await $picker.color({ color: this.get() })
                                    this.set(color.components)
                                    $(colorId).bgcolor = $rgba(
                                        color.components.red,
                                        color.components.green,
                                        color.components.blue,
                                        color.components.alpha
                                    )
                                }
                            },
                            layout: (make, view) => {
                                make.right.inset(0)
                                make.height.width.equalTo(view.super.height)
                            }
                        }
                    ],
                    layout: (make, view) => {
                        make.height.equalTo(SettingItem.rowHeight)
                        make.width.equalTo(view.super)
                    }
                }
            ],
            layout: $layout.fill
        }
    }
}

class SettingDate extends SettingItem {
    with({ mode = 2 } = {}) {
        this.options = { mode }
        return this
    }

    getView({ mode = 2 } = {}) {
        const getFormatDate = date => {
            let str = ""
            if (typeof date === "number") date = new Date(date)
            switch (mode) {
                case 0:
                    str = date.toLocaleTimeString()
                    break
                case 1:
                    str = date.toLocaleDateString()
                    break
                case 2:
                    str = date.toLocaleString()
                    break
            }
            return str
        }
        return {
            type: "view",
            props: { id: this.id, selectable: true },
            views: [
                this.createLineLabel(),
                {
                    type: "view",
                    views: [
                        {
                            type: "label",
                            props: {
                                id: `${this.id}-label`,
                                color: $color("secondaryText"),
                                text: this.get() ? getFormatDate(this.get()) : "None"
                            },
                            layout: (make, view) => {
                                make.right.inset(0)
                                make.height.equalTo(view.super)
                            }
                        }
                    ],
                    events: {
                        tapped: async () => {
                            const settingData = this.get()
                            const date = await $picker.date({
                                props: {
                                    mode: mode,
                                    date: settingData ? settingData : Date.now()
                                }
                            })
                            this.set(date.getTime())
                            $(`${this.id}-label`).text = getFormatDate(date)
                        }
                    },
                    layout: (make, view) => {
                        make.right.inset(SettingItem.edgeOffset)
                        make.height.equalTo(SettingItem.rowHeight)
                        make.width.equalTo(view.super)
                    }
                }
            ],
            layout: $layout.fill
        }
    }
}

class SettingInput extends SettingItem {
    with({ secure = false, kbType = $kbType.default, saveFunc } = {}) {
        this.options = { secure, kbType, saveFunc }
        return this
    }

    getView({ secure = false, kbType = $kbType.default, saveFunc } = {}) {
        if (saveFunc === undefined) {
            saveFunc = data => {
                return this.set(data)
            }
        }
        const inputId = this.id + "-input"
        return {
            type: "view",
            props: { id: this.id, selectable: true },
            views: [
                this.createLineLabel(),
                {
                    type: "input",
                    props: {
                        id: inputId,
                        type: kbType,
                        align: $align.right,
                        bgcolor: $color("clear"),
                        textColor: $color("secondaryText"),
                        text: this.get(),
                        font: $font(16),
                        secure: secure,
                        accessoryView: UIKit.blurBox({ height: 44 }, [
                            UIKit.separatorLine({}, UIKit.align.top),
                            {
                                type: "button",
                                props: {
                                    title: $l10n("DONE"),
                                    bgcolor: $color("clear"),
                                    titleColor: $color("primaryText")
                                },
                                layout: (make, view) => {
                                    make.right.inset(SettingItem.edgeOffset)
                                    make.centerY.equalTo(view.super)
                                },
                                events: {
                                    tapped: () => {
                                        $(inputId).blur()
                                    }
                                }
                            },
                            {
                                type: "button",
                                props: {
                                    title: $l10n("CANCEL"),
                                    bgcolor: $color("clear"),
                                    titleColor: $color("primaryText")
                                },
                                layout: (make, view) => {
                                    make.left.inset(SettingItem.edgeOffset)
                                    make.centerY.equalTo(view.super)
                                },
                                events: {
                                    tapped: () => {
                                        const sender = $(inputId)
                                        const savedData = this.get("")
                                        if (sender.text !== savedData) {
                                            sender.text = savedData
                                        }
                                        sender.blur()
                                    }
                                }
                            }
                        ])
                    },
                    layout: (make, view) => {
                        // 与标题间距 SettingItem.edgeOffset
                        make.left.equalTo(view.prev.get("label").right).offset(SettingItem.edgeOffset)
                        make.right.inset(SettingItem.edgeOffset)
                        make.width.greaterThanOrEqualTo(50) // 30 大约是清空按钮的宽度
                        make.height.equalTo(view.super)
                        make.left.priority(10)
                        make.width.priority(10)
                    },
                    events: {
                        didBeginEditing: sender => {
                            // 使输入可见
                            sender.secure = false
                            // 防止键盘遮挡
                            if (!$app.autoKeyboardEnabled) {
                                $app.autoKeyboardEnabled = true
                            }
                        },
                        returned: sender => {
                            sender.blur()
                        },
                        didEndEditing: async sender => {
                            const savedData = this.get("")
                            if (!saveFunc(sender.text)) {
                                sender.text = savedData
                            }

                            // 恢复 secure
                            if (secure) {
                                sender.secure = secure
                            }
                        }
                    }
                }
            ],
            layout: $layout.fill
        }
    }
}

class SettingNumber extends SettingItem {
    getView() {
        return new SettingInput(this).getView({
            secure: false,
            kbType: $kbType.decimal,
            saveFunc: text => {
                const isNumber = str => {
                    const reg = /^[0-9]+.?[0-9]*$/
                    return reg.test(str)
                }
                if (text === "" || !isNumber(text)) {
                    $ui.toast($l10n("INVALID_VALUE"))
                    return false
                }

                return this.set(Number(text))
            }
        })
    }
}

class SettingIcon extends SettingItem {
    with({ bgcolor = "#000000" } = {}) {
        this.options = { bgcolor }
        return this
    }

    /**
     *
     * @param {string|Object} bgcolor 指定预览时的背景色，默认 "#000000"
     * @returns {object}
     */
    getView({ bgcolor = "#000000" } = {}) {
        const imageId = `${this.id}-image`
        return {
            type: "view",
            props: { id: this.id, selectable: true },
            views: [
                this.createLineLabel(),
                {
                    type: "view",
                    views: [
                        {
                            type: "image",
                            props: {
                                cornerRadius: 8,
                                bgcolor: typeof bgcolor === "string" ? $color(bgcolor) : bgcolor,
                                smoothCorners: true
                            },
                            layout: (make, view) => {
                                make.right.inset(SettingItem.edgeOffset)
                                make.centerY.equalTo(view.super)
                                make.size.equalTo($size(30, 30))
                            }
                        },
                        {
                            type: "image",
                            props: {
                                id: imageId,
                                image: $image(this.get()),
                                icon: $icon(this.get()?.slice(5, this.get().indexOf(".")), $color("#ffffff")),
                                tintColor: $color("#ffffff")
                            },
                            layout: (make, view) => {
                                make.right.equalTo(view.prev).offset(-5)
                                make.centerY.equalTo(view.super)
                                make.size.equalTo($size(20, 20))
                            }
                        }
                    ],
                    events: {
                        tapped: () => {
                            $ui.menu({
                                items: [$l10n("JSBOX_ICON"), $l10n("SF_SYMBOLS"), $l10n("IMAGE_BASE64")],
                                handler: async (title, idx) => {
                                    if (idx === 0) {
                                        const icon = await $ui.selectIcon()
                                        this.set(icon)
                                        $(imageId).icon = $icon(icon.slice(5, icon.indexOf(".")), $color("#ffffff"))
                                    } else if (idx === 1 || idx === 2) {
                                        $input.text({
                                            text: "",
                                            placeholder: title,
                                            handler: text => {
                                                if (text === "") {
                                                    $ui.toast($l10n("INVALID_VALUE"))
                                                    return
                                                }
                                                this.set(text)
                                                if (idx === 1) $(imageId).symbol = text
                                                else $(imageId).image = $image(text)
                                            }
                                        })
                                    }
                                }
                            })
                        }
                    },
                    layout: (make, view) => {
                        make.right.inset(0)
                        make.height.equalTo(SettingItem.rowHeight)
                        make.width.equalTo(view.super)
                    }
                }
            ],
            layout: $layout.fill
        }
    }
}

class SettingPush extends SettingItem {
    with({ view, navButtons = [] } = {}) {
        this.options = { view, navButtons }
        return this
    }

    tapped() {
        let { view, navButtons } = this.options

        view = this.evalValues(view, {})
        navButtons = this.evalValues(navButtons)
        if (navButtons.length > 0) {
            navButtons.map(button => {
                if (typeof button.tapped === "string") {
                    const buttonTappedString = button.tapped
                    button.tapped = () => {
                        this.evalValues(buttonTappedString)
                    }
                }
                button.handler = button.tapped
                return button
            })
        }

        return new Promise((resolve, reject) => {
            if (this.setting.isUseJsboxNav) {
                const options = {
                    title: this.title,
                    props: view.props ?? {},
                    views: [view],
                    disappeared: () => resolve()
                }
                if (navButtons.length > 0) {
                    options.navButtons = navButtons
                }
                UIKit.push(options)
            } else {
                const navigationView = new NavigationView()
                navigationView.setView(view).navigationBarTitle(this.title)
                navigationView.navigationBarItems.addPopButton()
                navigationView.navigationBar.setLargeTitleDisplayMode(NavigationBar.largeTitleDisplayModeNever)
                if (this.setting.hasSectionTitle(view)) {
                    navigationView.navigationBar.setContentViewHeightOffset(-10)
                }

                if (navButtons.length > 0) {
                    navigationView.navigationBarItems.setRightButtons(navButtons)
                }
                this.setting.viewController.setEvent("onPop", () => resolve())

                this.setting.viewController.push(navigationView)
            }
        })
    }

    getView() {
        return {
            type: "view",
            props: { id: this.id, selectable: true, info: { key: this.key } },
            views: [
                this.createLineLabel(),
                {
                    // 仅用于显示图片
                    type: "button",
                    props: {
                        symbol: "chevron.right",
                        bgcolor: $color("clear"),
                        tintColor: $color("secondaryText")
                    },
                    events: { tapped: () => this.tapped() },
                    layout: (make, view) => {
                        make.centerY.equalTo(view.super)
                        make.right.inset(SettingItem.edgeOffset)
                        make.height.equalTo(view.super)
                    }
                }
            ],
            layout: $layout.fill
        }
    }
}

class SettingChild extends SettingPush {
    with({ children } = {}) {
        super.with({
            view: () => {
                return this.setting.getListView(children, {}, this.id)
            }
        })
        this.options.children = children
        return this
    }
}

class SettingImage extends SettingItem {
    getImagePath(compress = false) {
        let name = $text.MD5(this.key) + ".jpg"
        if (compress) {
            name = "compress." + name
        }

        return this.setting.imagePath + name
    }

    getImage(compress = false) {
        try {
            return this.setting.fileStorage.readSync(this.getImagePath(compress))
        } catch (error) {
            if (error instanceof FileStorageFileNotFoundError) {
                return null
            }
            throw error
        }
    }

    get(_default = null) {
        return this.getImage(false) ?? null
    }

    getView() {
        const imageId = `${this.id}-image`
        const noneImage = $image("questionmark.square.dashed")

        const withLoading = action => {
            return async () => {
                $(imageId).hidden = true
                $(`${imageId}-spinner`).hidden = false
                await $wait(0.1)
                try {
                    await action()
                } catch (error) {
                    $ui.alert({
                        title: $l10n("ERROR"),
                        message: String(error)
                    })
                }
                await $wait(0.1)
                $(`${imageId}-spinner`).hidden = true
                $(imageId).hidden = false
            }
        }
        const menus = [
            {
                title: $l10n("PREVIEW"),
                handler: withLoading(() => {
                    const data = this.getImage(false)
                    if (data) {
                        Sheet.quickLookImage(data)
                    } else {
                        $ui.toast($l10n("NO_IMAGE"))
                    }
                })
            },
            {
                inline: true,
                items: [
                    {
                        title: $l10n("SELECT_IMAGE_PHOTO"),
                        handler: withLoading(async () => {
                            const resp = await $photo.pick({ format: "data" })
                            if (!resp.status || !resp.data) {
                                if (resp?.error?.description !== "canceled") {
                                    throw new Error(resp?.error?.description)
                                }
                                return
                            }
                            // 控制压缩图片大小
                            const image = UIKit.compressImage(resp.data.image)
                            this.setting.fileStorage.write(this.getImagePath(true), image.jpg(0.8))
                            this.setting.fileStorage.write(this.getImagePath(), resp.data)
                            $(imageId).image = image
                            $ui.success($l10n("SUCCESS"))
                        })
                    },
                    {
                        title: $l10n("SELECT_IMAGE_ICLOUD"),
                        handler: withLoading(async () => {
                            const data = await $drive.open()
                            if (!data) return
                            // 控制压缩图片大小
                            const image = UIKit.compressImage(data.image)
                            this.setting.fileStorage.write(this.getImagePath(true), image.jpg(0.8))
                            this.setting.fileStorage.write(this.getImagePath(), data)
                            $(imageId).image = image
                            $ui.success($l10n("SUCCESS"))
                        })
                    }
                ]
            },
            {
                title: $l10n("CLEAR_IMAGE"),
                destructive: true,
                handler: withLoading(() => {
                    this.setting.fileStorage.delete(this.getImagePath(true))
                    this.setting.fileStorage.delete(this.getImagePath())
                    $(imageId).image = noneImage
                    $ui.success($l10n("SUCCESS"))
                })
            }
        ]

        return {
            type: "view",
            props: { id: this.id, selectable: true },
            views: [
                this.createLineLabel(),
                {
                    type: "view",
                    views: [
                        {
                            type: "image",
                            props: {
                                id: imageId,
                                image: this.getImage(true)?.image ?? noneImage
                            },
                            layout: (make, view) => {
                                make.right.inset(SettingItem.edgeOffset)
                                make.centerY.equalTo(view.super)
                                make.size.equalTo($size(30, 30))
                            }
                        },
                        {
                            type: "spinner",
                            props: {
                                id: `${imageId}-spinner`,
                                loading: true,
                                hidden: true
                            },
                            layout: (make, view) => {
                                make.size.equalTo(view.prev)
                                make.left.top.equalTo(view.prev)
                            }
                        },
                        {
                            type: "button",
                            props: {
                                menu: {
                                    pullDown: true,
                                    asPrimary: true,
                                    items: menus
                                },
                                bgcolor: $color("clear")
                            },
                            layout: (make, view) => {
                                make.right.inset(SettingItem.edgeOffset)
                                make.centerY.equalTo(view.super)
                                make.size.equalTo($size(30, 30))
                            }
                        }
                    ],
                    layout: (make, view) => {
                        make.right.inset(0)
                        make.height.equalTo(SettingItem.rowHeight)
                        make.width.equalTo(view.super)
                    }
                }
            ],
            layout: $layout.fill
        }
    }
}

module.exports = {
    SettingItem,
    SettingInfo,
    SettingSwitch,
    SettingString,
    SettingStepper,
    SettingScript,
    SettingTab,
    SettingMenu,
    SettingColor,
    SettingDate,
    SettingInput,
    SettingNumber,
    SettingIcon,
    SettingPush,
    SettingChild,
    SettingImage
}
