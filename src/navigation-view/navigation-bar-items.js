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
    static edges = 15
    static size = $size(38, 38)
    static fontSize = 16
    static iconSize = $size(
        BarButtonItem.size.width - BarButtonItem.edges,
        BarButtonItem.size.height - BarButtonItem.edges
    ) // 比 size 小 edges

    /**
     * 标题
     * @type {string}
     */
    title

    /**
     * SF Symbol 或者 $image 对象
     * @type {string|$image}
     */
    symbol

    /**
     * 对齐方式
     */
    align = UIKit.align.right

    setTitle(title) {
        this.title = title
        return this
    }

    /**
     * 设置图标
     * @param {string|$image} symbol SF Symbol 或者 $image 对象
     * @returns
     */
    setSymbol(symbol) {
        this.symbol = symbol
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

    #actionStart() {
        // 隐藏button，显示spinner
        $(this.id).hidden = true
        $("spinner-" + this.id).hidden = false
    }

    #actionDone() {
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

    #actionCancel() {
        $(this.id).hidden = false
        $("spinner-" + this.id).hidden = true
    }

    getView() {
        const userTapped = this.events.tapped
        this.events.tapped = sender => {
            if (!userTapped) return
            userTapped(
                {
                    start: () => this.#actionStart(),
                    done: () => this.#actionDone(),
                    cancel: () => this.#actionCancel()
                },
                sender
            )
        }
        return {
            type: "view",
            props: { info: { align: this.align } },
            views: [
                {
                    type: "button",
                    props: Object.assign(
                        {
                            id: this.id,
                            bgcolor: $color("clear"),
                            font: $font(BarButtonItem.fontSize),
                            tintColor: UIKit.textColor,
                            titleColor: UIKit.textColor,
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
                                    tintColor: UIKit.textColor
                                },
                                this.symbol === undefined
                                    ? {}
                                    : typeof this.symbol === "string"
                                    ? { symbol: this.symbol }
                                    : { data: this.symbol.png }
                            ),
                            layout: (make, view) => {
                                make.center.equalTo(view.super)
                                make.size.equalTo(BarButtonItem.iconSize)
                            }
                        },
                        {
                            type: "image",
                            props: {
                                id: `icon-checkmark-${this.id}`,
                                alpha: 0,
                                tintColor: UIKit.textColor,
                                symbol: "checkmark"
                            },
                            layout: (make, view) => {
                                make.center.equalTo(view.super)
                                make.size.equalTo(BarButtonItem.iconSize)
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
                if (this.title) {
                    const fontSize = $text.sizeThatFits({
                        text: this.title,
                        width: UIKit.windowSize.width,
                        font: $font(BarButtonItem.fontSize)
                    })
                    const width = Math.ceil(fontSize.width) + BarButtonItem.edges // 文本按钮增加内边距
                    make.size.equalTo($size(width, BarButtonItem.size.height))
                } else {
                    make.size.equalTo(BarButtonItem.size)
                }
                make.centerY.equalTo(view.super)
                if (view.prev && view.prev?.info?.align === this.align) {
                    if (this.align === UIKit.align.right) make.right.equalTo(view.prev.left)
                    else make.left.equalTo(view.prev.right)
                } else {
                    // 留一半边距，按钮内边距是另一半
                    const edges = BarButtonItem.edges / 2
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
    static creat({ symbol, title, tapped, menu, events, align = UIKit.align.right } = {}) {
        const barButtonItem = new BarButtonItem()
        barButtonItem
            .setEvents(
                Object.assign(
                    {
                        tapped: tapped
                    },
                    events
                )
            )
            .setAlign(align)
            .setSymbol(symbol)
            .setTitle(title)
            .setMenu(menu)
        return barButtonItem
    }
}

/**
 * @typedef {NavigationBarItems} NavigationBarItems
 */
class NavigationBarItems {
    rightButtons = []
    leftButtons = []
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
    addRightButton({ symbol, title, tapped, menu, events } = {}) {
        this.rightButtons.push(
            BarButtonItem.creat({ symbol, title, tapped, menu, events, align: UIKit.align.right }).definition
        )
        if (!this.hasbutton) this.hasbutton = true
        return this
    }

    /**
     *
     * @param {BarButtonItemProperties} param0
     * @returns {this}
     */
    addLeftButton({ symbol, title, tapped, menu, events } = {}) {
        this.leftButtons.push(
            BarButtonItem.creat({ symbol, title, tapped, menu, events, align: UIKit.align.left }).definition
        )
        if (!this.hasbutton) this.hasbutton = true
        return this
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
                make.left.equalTo(view.super.safeArea).offset(BarButtonItem.edges)
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
