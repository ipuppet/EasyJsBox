const { View } = require("../view")
const { UIKit } = require("../ui-kit")

class BarTitleView extends View {
    controller = {}

    setController(controller) {
        this.controller = controller
        return this
    }
}

/**
 * 用于创建一个靠右侧按钮（自动布局）
 * this.events.tapped 按钮点击事件，会传入三个函数，start()、done() 和 cancel()
 *     调用 start() 表明按钮被点击，准备开始动画
 *     调用 done() 表明您的操作已经全部完成，默认操作成功完成，播放一个按钮变成对号的动画
 *                 若第一个参数传出false则表示运行出错
 *                 第二个参数为错误原因($ui.toast(message))
 *     调用 cancel() 表示取消操作
 *     示例：
 *      (start, done, cancel) => {
 *          start()
 *          const upload = (data) => { return false }
 *          if (upload(data)) { done() }
 *          else { done(false, "Upload Error!") }
 *      }
 */

/**
 * @typedef {object} BarButtonItemProperties
 * @property {string} title
 * @property {string} symbol
 * @property {Function} tapped
 * @property {object} menu
 * @property {object} events
 */

class BarButtonItem extends View {
    static #instance

    edges = 15
    buttonEdges = this.edges / 2
    iconSize = 24
    fontSize = 17

    color = UIKit.textColor

    /**
     * 标题
     * @type {string}
     */
    title

    /**
     * SF Symbol 或者 $image 对象
     * @type {string|$image}
     */
    #symbol
    #symbolType

    /**
     * 对齐方式
     */
    align = UIKit.align.right

    get symbol() {
        if (typeof this.#symbol === "string") {
            if (this.#symbolType === "icon") {
                return $icon(this.#symbol, this.color).ocValue().$image().jsValue()
            } else {
                return $image(this.#symbol)
            }
        } else {
            return this.#symbol
        }
    }

    set symbol(symbol) {
        if (typeof this.#symbol === "string") {
            if (isNaN(symbol)) {
                this.#symbolType = "image"
            } else {
                this.#symbolType = "icon"
            }
        } else {
            if (String(symbol) === "[object BBFileIcon]") {
                this.#symbolType = "icon"
            } else {
                this.#symbolType = "image"
            }
        }
        this.#symbol = symbol
    }

    get width() {
        if (this.title) {
            const fontSize = $text.sizeThatFits({
                text: this.title,
                width: UIKit.windowSize.width,
                font: $font(this.fontSize)
            })
            return Math.ceil(fontSize.width) + this.edges // 文本按钮增加内边距
        }

        return this.iconSize + this.edges
    }

    static get style() {
        if (this.#instance === undefined) {
            this.#instance = new BarButtonItem()
        }

        return this.#instance
    }

    setEdges(edges) {
        this.edges = edges
        return this
    }

    setFontSize(fontSize) {
        this.fontSize = fontSize
        if ($(this.id)) {
            $(this.id).font = $font(this.fontSize)
        }
        return this
    }

    setColor(color = UIKit.textColor) {
        this.color = color
        if ($(this.id)) {
            $(this.id).titleColor = this.color
            $(`icon-button-${this.id}`).titleColor = this.color
            $(`icon-checkmark-${this.id}`).titleColor = this.color
        }
        return this
    }

    setTitle(title) {
        this.title = title
        if ($(this.id)) {
            $(this.id).title = this.title
        }
        return this
    }

    /**
     * 设置图标
     * @param {string|$image} symbol SF Symbol 或者 $image 对象
     * @returns
     */
    setSymbol(symbol) {
        this.symbol = symbol
        if ($(`icon-button-${this.id}`)) {
            $(`icon-button-${this.id}`).image = this.symbol
        }
        return this
    }

    setMenu(menu) {
        this.menu = menu
        return this
    }

    setAlign(align) {
        this.align = align
        return this
    }

    setLoading(loading) {
        if (loading) {
            // 隐藏button，显示spinner
            $(this.id).hidden = true
            $("spinner-" + this.id).hidden = false
        } else {
            $(this.id).hidden = false
            $("spinner-" + this.id).hidden = true
        }
    }

    #checkMark() {
        const buttonIcon = $(`icon-button-${this.id}`)
        const checkmarkIcon = $(`icon-checkmark-${this.id}`)
        buttonIcon.alpha = 0
        $(this.id).hidden = false
        $("spinner-" + this.id).hidden = true
        // 成功动画
        $ui.animate({
            duration: 0.6,
            animation: () => {
                checkmarkIcon.alpha = 1
            },
            completion: () => {
                $delay(0.3, () =>
                    $ui.animate({
                        duration: 0.6,
                        animation: () => {
                            checkmarkIcon.alpha = 0
                        },
                        completion: () => {
                            $ui.animate({
                                duration: 0.4,
                                animation: () => {
                                    buttonIcon.alpha = 1
                                },
                                completion: () => {
                                    buttonIcon.alpha = 1
                                }
                            })
                        }
                    })
                )
            }
        })
    }

    hide() {
        $(this.id + "-container").hidden = true
    }
    show() {
        $(this.id + "-container").hidden = false
    }

    getView() {
        const userTapped = this.events.tapped
        this.events.tapped = sender => {
            if (!userTapped) return
            userTapped(
                {
                    start: () => this.setLoading(true),
                    done: () => this.#checkMark(),
                    cancel: () => this.setLoading(false)
                },
                sender
            )
        }

        return {
            type: "view",
            props: {
                id: this.id + "-container",
                info: { align: this.align }
            },
            views: [
                {
                    type: "button",
                    props: Object.assign(
                        {
                            id: this.id,
                            bgcolor: $color("clear"),
                            font: $font(this.fontSize),
                            titleColor: this.color,
                            contentEdgeInsets: $insets(0, 0, 0, 0),
                            titleEdgeInsets: $insets(0, 0, 0, 0),
                            imageEdgeInsets: $insets(0, 0, 0, 0)
                        },
                        this.menu ? { menu: this.menu } : {},
                        this.title ? { title: this.title } : {},
                        this.props
                    ),
                    views: [
                        {
                            type: "image",
                            props: Object.assign(
                                {
                                    id: `icon-button-${this.id}`,
                                    hidden: this.symbol === undefined,
                                    tintColor: this.color
                                },
                                this.symbol ? { image: this.symbol } : {}
                            ),
                            layout: (make, view) => {
                                if (this.symbol) {
                                    make.size.equalTo(UIKit.getSymbolSize(this.symbol, this.iconSize))
                                }
                                make.center.equalTo(view.super)
                            }
                        },
                        {
                            type: "image",
                            props: {
                                id: `icon-checkmark-${this.id}`,
                                alpha: 0,
                                tintColor: this.color,
                                symbol: "checkmark"
                            },
                            layout: (make, view) => {
                                make.center.equalTo(view.super)
                                make.size.equalTo(UIKit.getSymbolSize("checkmark", this.iconSize))
                            }
                        }
                    ],
                    events: this.events,
                    layout: $layout.fill
                },
                {
                    type: "spinner",
                    props: {
                        id: "spinner-" + this.id,
                        loading: true,
                        hidden: true
                    },
                    layout: $layout.fill
                }
            ],
            layout: (make, view) => {
                make.size.equalTo($size(this.width, UIKit.NavigationBarNormalHeight))
                make.centerY.equalTo(view.super)
                if (view.prev && view.prev?.info?.align === this.align) {
                    if (this.align === UIKit.align.right) make.right.equalTo(view.prev.left).offset(-this.buttonEdges)
                    else make.left.equalTo(view.prev.right).offset(this.buttonEdges)
                } else {
                    // 留一半边距，按钮内边距是另一半
                    const edges = this.edges / 2
                    if (this.align === UIKit.align.right) make.right.inset(edges)
                    else make.left.inset(edges)
                }
            }
        }
    }

    /**
     * 用于快速创建 BarButtonItem
     * @param {BarButtonItemProperties} param0
     * @returns {BarButtonItem}
     */
    static creat({ id, symbol, title, tapped, menu, events, color, align = UIKit.align.right } = {}) {
        const barButtonItem = new BarButtonItem()
        barButtonItem
            .setEvents(Object.assign({ tapped: tapped }, events))
            .setAlign(align)
            .setSymbol(symbol)
            .setTitle(title)
            .setColor(color)
            .setMenu(menu)
        if (id) {
            barButtonItem.setProp("id", id)
        }
        return barButtonItem
    }
}

/**
 * @typedef {NavigationBarItems} NavigationBarItems
 */
class NavigationBarItems {
    rightButtons = []
    leftButtons = []
    #buttonIndex = {}
    hasbutton = false

    isPinTitleView = false

    setTitleView(titleView) {
        this.titleView = titleView
        return this
    }

    pinTitleView() {
        this.isPinTitleView = true
        return this
    }

    setFixedFooterView(fixedFooterView) {
        this.fixedFooterView = fixedFooterView
        return this
    }

    /**
     *
     * @param {BarButtonItemProperties[]} buttons
     * @returns {this}
     */
    setRightButtons(buttons) {
        buttons.forEach(button => this.addRightButton(button))
        if (!this.hasbutton) this.hasbutton = true
        return this
    }

    /**
     *
     * @param {BarButtonItemProperties[]} buttons
     * @returns {this}
     */
    setLeftButtons(buttons) {
        buttons.forEach(button => this.addLeftButton(button))
        if (!this.hasbutton) this.hasbutton = true
        return this
    }

    /**
     *
     * @param {BarButtonItemProperties} param0
     * @returns {this}
     */
    addRightButton({ id, symbol, title, tapped, menu, events, color } = {}) {
        const button = BarButtonItem.creat({ id, symbol, title, tapped, menu, events, color, align: UIKit.align.right })
        this.rightButtons.push(button)
        this.#buttonIndex[id ?? button.id] = button
        if (!this.hasbutton) this.hasbutton = true
        return this
    }

    /**
     *
     * @param {BarButtonItemProperties} param0
     * @returns {this}
     */
    addLeftButton({ id, symbol, title, tapped, menu, events, color } = {}) {
        const button = BarButtonItem.creat({ id, symbol, title, tapped, menu, events, color, align: UIKit.align.left })
        this.leftButtons.push(button)
        this.#buttonIndex[id ?? button.id] = button
        if (!this.hasbutton) this.hasbutton = true
        return this
    }

    getButton(id) {
        return this.#buttonIndex[id]
    }

    getButtons() {
        return Object.values(this.#buttonIndex)
    }

    /**
     * 覆盖左侧按钮
     * @param {string} parent 父页面标题，将会显示为文本按钮
     * @param {object} view 自定义按钮视图
     * @param {function} onPop 自定义按钮视图
     * @returns {this}
     */
    addPopButton(parent, view, onPop) {
        if (!parent) {
            parent = $l10n("BACK")
        }
        this.popButtonView = view ?? {
            // 返回按钮
            type: "button",
            props: {
                bgcolor: $color("clear"),
                symbol: "chevron.left",
                tintColor: UIKit.linkColor,
                title: ` ${parent}`,
                titleColor: UIKit.linkColor,
                font: $font("bold", 16)
            },
            layout: (make, view) => {
                make.left.equalTo(view.super.safeArea).offset(BarButtonItem.style.edges)
                make.centerY.equalTo(view.super.safeArea)
            },
            events: {
                tapped: () => {
                    $ui.pop()
                    if (typeof onPop === "function") {
                        onPop()
                    }
                }
            }
        }
        return this
    }

    removePopButton() {
        this.popButtonView = undefined
        return this
    }
}

module.exports = {
    BarTitleView,
    BarButtonItem,
    NavigationBarItems
}
