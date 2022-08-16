const { View } = require("../view")
const { UIKit } = require("../ui-kit")

class BarTitleView extends View {
    height = 20
    topOffset = 15
    bottomOffset = 10
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
 * @typedef {Object} BarButtonItemProperties
 * @property {string} title
 * @property {string} symbol
 * @property {Function} tapped
 * @property {Object} menu
 * @property {Object} events
 *
 */

class BarButtonItem extends View {
    static size = $size(38, 38)
    static iconSize = $size(23, 23) // 比 size 小 edges
    static edges = 15

    /**
     * 标题
     * @type {string}
     */
    title = ""

    /**
     * 对齐方式
     */
    align = UIKit.align.right

    setTitle(title = "") {
        this.title = title
        return this
    }

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
            views: [
                {
                    type: "button",
                    props: Object.assign(
                        {
                            id: this.id,
                            bgcolor: $color("clear"),
                            tintColor: UIKit.textColor,
                            titleColor: UIKit.textColor,
                            contentEdgeInsets: $insets(0, 0, 0, 0),
                            titleEdgeInsets: $insets(0, 0, 0, 0),
                            imageEdgeInsets: $insets(0, 0, 0, 0)
                        },
                        this.menu ? { menu: this.menu } : {},
                        this.title?.length > 0 ? { title: this.title } : {},
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
                make.size.equalTo(BarButtonItem.size)
                make.centerY.equalTo(view.super)
                if (view.prev && view.prev.id !== "label" && view.prev.id !== undefined) {
                    if (this.align === UIKit.align.right) make.right.equalTo(view.prev.left)
                    else make.left.equalTo(view.prev.right)
                } else {
                    // 图片类型留一半边距，图标和按钮边距是另一半
                    const edges = this.symbol ? BarButtonItem.edges / 2 : BarButtonItem.edges
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
    static creat({ symbol, title, tapped, menu, events, align = UIKit.align.right }) {
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
    addRightButton({ symbol, title, tapped, menu, events }) {
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
    addLeftButton({ symbol, title, tapped, menu, events }) {
        this.leftButtons.push(
            BarButtonItem.creat({ symbol, title, tapped, menu, events, align: UIKit.align.left }).definition
        )
        if (!this.hasbutton) this.hasbutton = true
        return this
    }

    /**
     * 覆盖左侧按钮
     * @param {string} parent 父页面标题，将会显示为文本按钮
     * @param {Object} view 自定义按钮视图
     * @returns {this}
     */
    addPopButton(parent, view) {
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