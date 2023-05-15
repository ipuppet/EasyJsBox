const { FileStorageFileNotFoundError } = require("../file-storage")
const { Kernel } = require("../kernel")
const { UIKit } = require("../ui-kit")
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
    #options = []

    constructor(setting, key, title, icon) {
        this.setting = setting
        this.key = key
        this.title = title
        this.icon = icon
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
            this.#id = `setting-${this.setting.name}-${this.key}`
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

    set(value) {
        return this.setting.set(this.key, value)
    }

    get(_default = null) {
        return this.setting.getOriginal(this.key, _default)
    }

    getId(key) {
        return `setting-${this.setting.name}-${key}`
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

    options(...options) {
        this.#options = options ?? []
        return this
    }

    getView() {}

    create() {
        return this.getView(...this.#options)
    }

    static from(item) {
        return new this(item.setting, item.key, item.title, item.icon)
    }
}

class SettingInfo extends SettingItem {
    getView(value) {
        const isArray = Array.isArray(value)
        const text = isArray ? value[0] : value
        const moreInfo = isArray ? value[1] : value
        return {
            type: "view",
            props: { selectable: true },
            views: [
                this.createLineLabel(),
                {
                    type: "label",
                    props: {
                        text: text,
                        align: $align.right,
                        textColor: $color("darkGray")
                    },
                    layout: (make, view) => {
                        make.centerY.equalTo(view.prev)
                        make.right.inset(SettingItem.edgeOffset)
                        make.width.equalTo(180)
                    }
                },
                {
                    // 监听点击动作
                    type: "view",
                    events: {
                        tapped: () => {
                            $ui.alert({
                                title: this.title,
                                message: moreInfo,
                                actions: [
                                    {
                                        title: $l10n("COPY"),
                                        handler: () => {
                                            $clipboard.text = moreInfo
                                            $ui.toast($l10n("COPIED"))
                                        }
                                    },
                                    { title: $l10n("OK") }
                                ]
                            })
                        }
                    },
                    layout: (make, view) => {
                        make.right.inset(0)
                        make.size.equalTo(view.super)
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
    getView(min, max) {
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
    // withTouchEvents 延时自动关闭高亮，防止 touchesMoved 事件未正常调用
    #withTouchEventT
    method = this.setting.method

    #touchHighlightStart() {
        $(this.id).bgcolor = $color("systemFill")
    }

    #touchHighlightEnd(duration = 0.3) {
        if (duration === 0) {
            $(this.id).bgcolor = $color("clear")
        } else {
            $ui.animate({
                duration: duration,
                animation: () => {
                    $(this.id).bgcolor = $color("clear")
                }
            })
        }
    }

    #withTouchEvent(events, withTappedHighlight = false, highlightEndDelay = 0) {
        events = Object.assign(events, {
            touchesBegan: () => {
                this.#touchHighlightStart()
                // 延时自动关闭高亮，防止 touchesMoved 事件未正常调用
                this.#withTouchEventT = $delay(1, () => this.#touchHighlightEnd(0))
            },
            touchesMoved: () => {
                this.#withTouchEventT?.cancel()
                this.#touchHighlightEnd(0)
            }
        })
        if (withTappedHighlight) {
            const tapped = events.tapped
            events.tapped = () => {
                // highlight
                this.#touchHighlightStart()
                $delay(highlightEndDelay, () => this.#touchHighlightEnd())
                if (typeof tapped === "function") tapped()
            }
        }
        return events
    }

    getView(script) {
        const buttonId = `${this.id}-button`
        const rightSymbol = "chevron.right"
        const start = () => {
            // 隐藏 button，显示 spinner
            $(buttonId).alpha = 0
            $(`${buttonId}-spinner`).alpha = 1
            this.#touchHighlightStart()
        }
        const cancel = () => {
            $(buttonId).alpha = 1
            $(`${buttonId}-spinner`).alpha = 0
            this.#touchHighlightEnd()
        }
        const done = () => {
            $(`${buttonId}-spinner`).alpha = 0
            this.#touchHighlightEnd()
            const button = $(buttonId)
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
                            button.symbol = rightSymbol
                            $ui.animate({
                                duration: 0.4,
                                animation: () => (button.alpha = 1)
                            })
                        }
                    })
                }
            })
            $delay(0.6, () => {})
        }
        return {
            type: "view",
            props: { id: this.id },
            views: [
                this.createLineLabel(),
                {
                    type: "view",
                    views: [
                        {
                            // 仅用于显示图片
                            type: "button",
                            props: {
                                id: buttonId,
                                symbol: rightSymbol,
                                bgcolor: $color("clear"),
                                tintColor: $color("secondaryText")
                            },
                            layout: (make, view) => {
                                make.centerY.equalTo(view.super)
                                make.right.inset(0)
                                make.height.equalTo(view.super)
                            }
                        },
                        {
                            type: "spinner",
                            props: {
                                id: `${buttonId}-spinner`,
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
                },
                { type: "view", layout: $layout.fill }
            ],
            events: this.#withTouchEvent({
                tapped: () => {
                    /**
                     * @type {ScriptAnimate}
                     */
                    const animate = {
                        start: start, // 会出现加载动画
                        cancel: cancel, // 会直接恢复箭头图标
                        done: done, // 会出现对号，然后恢复箭头
                        touchHighlightStart: () => this.#touchHighlightStart(), // 被点击的一行颜色加深
                        touchHighlightEnd: () => this.#touchHighlightEnd() // 被点击的一行颜色恢复
                    }
                    // 执行代码
                    if (typeof script === "function") {
                        script(animate)
                    } else if (script.startsWith("this.method")) {
                        // 传递 animate 对象
                        eval(`(()=>{return ${script}(animate)})()`)
                    } else {
                        eval(script)
                    }
                }
            }),
            layout: $layout.fill
        }
    }
}

class SettingTab extends SettingItem {
    getView(items, values) {
        if (typeof items === "string") {
            items = eval(`(()=>{return ${items}()})()`)
        } else if (typeof items === "function") {
            items = items()
        }
        if (typeof values === "string") {
            values = eval(`(()=>{return ${values}()})()`)
        } else if (typeof values === "function") {
            values = values()
        }

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
    getView(items, values, pullDown) {
        const labelId = `${this.id}-label`

        // 数据生成函数
        const getItems = () => {
            let res
            if (typeof items === "string") {
                res = eval(`(()=>{return ${items}()})()`)
            } else if (typeof items === "function") {
                res = items()
            } else {
                res = items ?? []
            }
            return res
        }
        const getValues = () => {
            let res
            if (typeof values === "string") {
                res = eval(`(()=>{return ${values}()})()`)
            } else if (typeof values === "function") {
                res = values()
            } else {
                res = values
            }
            return res
        }

        const tmpItems = getItems()
        const tmpValues = getValues()

        const isCustomizeValues = tmpItems?.length > 0 && tmpValues?.length === tmpItems?.length

        const handler = (title, idx) => {
            if (isCustomizeValues) {
                const tmpValues = getValues()
                this.set(tmpValues[idx])
            } else {
                this.set(idx)
            }
            $(labelId).title = title
        }
        const tapped = () => {
            if (pullDown) return

            $ui.menu({
                items: getItems(),
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
            events: { tapped },
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
    getView(mode = 2) {
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
    getView(secure = false, kbType = $kbType.default, saveFunc) {
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
                        const width = UIKit.getContentSize($font(16), this.get("")).width
                        make.width.greaterThanOrEqualTo(width + 30) // 30 大约是清空按钮的宽度
                        make.height.equalTo(view.super)
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
        return SettingInput.from(this).getView(false, $kbType.decimal, text => {
            const isNumber = str => {
                const reg = /^[0-9]+.?[0-9]*$/
                return reg.test(str)
            }
            if (text === "" || !isNumber(text)) {
                $ui.toast($l10n("INVALID_VALUE"))
                return false
            }

            return this.set(Number(text))
        })
    }
}

class SettingIcon extends SettingItem {
    /**
     *
     * @param {string|Object} bgcolor 指定预览时的背景色，默认 "#000000"
     * @returns {object}
     */
    getView(bgcolor = "#000000") {
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
    method = this.setting.method

    getView(view, tapped) {
        return {
            type: "view",
            layout: $layout.fill,
            props: { id: this.id, selectable: true },
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
                    layout: (make, view) => {
                        make.centerY.equalTo(view.super)
                        make.right.inset(SettingItem.edgeOffset)
                        make.height.equalTo(view.super)
                    }
                },
                { type: "view", layout: $layout.fill }
            ],
            events: {
                tapped: () => {
                    const push = view => {
                        if (typeof view === "string" && view.startsWith("this.method")) {
                            view = eval(`(()=>{return ${view}()})()`)
                        } else if (typeof view === "function") {
                            view = view()
                        }
                        if (this.setting.isUseJsboxNav) {
                            UIKit.push({
                                title: this.title,
                                props: view.props ?? {},
                                views: [view]
                            })
                        } else {
                            const navigationView = new NavigationView()
                            navigationView.setView(view).navigationBarTitle(this.title)
                            navigationView.navigationBarItems.addPopButton()
                            navigationView.navigationBar.setLargeTitleDisplayMode(
                                NavigationBar.largeTitleDisplayModeNever
                            )
                            if (this.setting.hasSectionTitle(view)) {
                                navigationView.navigationBar.setContentViewHeightOffset(-10)
                            }
                            this.setting.viewController.push(navigationView)
                        }
                    }
                    if (typeof tapped === "function") {
                        tapped(push)
                    } else {
                        push(view)
                    }
                }
            }
        }
    }
}

class SettingChild extends SettingItem {
    getView(children) {
        return SettingPush.from(this).getView(undefined, push => {
            if (this.setting.events?.onChildPush) {
                this.setting.callEvent("onChildPush", this.setting.getListView(children, {}), this.title)
            } else {
                push(this.setting.getListView(children, {}))
            }
        })
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
                        Kernel.quickLookImage(data)
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
                            const image = Kernel.compressImage(resp.data.image)
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
                            const image = Kernel.compressImage(data.image)
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
