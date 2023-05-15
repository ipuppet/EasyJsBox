const { UIKit } = require("../ui-kit")
const { Controller } = require("../controller")

const { BarTitleView } = require("./navigation-bar-items")

class SearchBar extends BarTitleView {
    height = 35
    topOffset = 15
    bottomOffset = 10
    horizontalOffset = 15
    kbType = $kbType.search
    placeholder = $l10n("SEARCH")
    inputEvents = {}
    keyboardView
    accessoryView

    cancelButtonFont = $font(16)

    constructor(args) {
        super(args)

        this.setController(new SearchBarController())
        this.controller.setSearchBar(this)
    }

    get cancelButtonWidth() {
        return UIKit.getContentSize(this.cancelButtonFont, $l10n("CANCEL")).width
    }

    /**
     * 重定向 event 到 input 组件
     * @param {*} event
     * @param {*} action
     * @returns
     */
    setEvent(event, action) {
        this.inputEvents[event] = action
        return this
    }

    setPlaceholder(placeholder) {
        this.placeholder = placeholder
        return this
    }

    setKbType(kbType) {
        this.kbType = kbType
        return this
    }

    setKeyboardView(keyboardView) {
        this.keyboardView = keyboardView
        return this
    }

    setAccessoryView(accessoryView) {
        this.accessoryView = accessoryView
        return this
    }

    onBeginEditingAnimate() {
        $ui.animate({
            duration: 0.3,
            animation: () => {
                const cancelButtonWidth = this.cancelButtonWidth
                $(this.id + "-cancel-button").updateLayout((make, view) => {
                    make.left.equalTo(view.super.right).offset(-cancelButtonWidth)
                })
                $(this.id + "-cancel-button").alpha = 1
                $(this.id + "-cancel-button").relayout()
                $(this.id + "-input").updateLayout(make => {
                    make.right.inset(cancelButtonWidth + this.horizontalOffset / 2)
                })
                $(this.id + "-input").relayout()
            }
        })
    }

    onEndEditingAnimate() {
        $ui.animate({
            duration: 0.3,
            animation: () => {
                $(this.id + "-cancel-button").updateLayout((make, view) => {
                    make.left.equalTo(view.super.right)
                })
                $(this.id + "-cancel-button").alpha = 0
                $(this.id + "-cancel-button").relayout()
                $(this.id + "-input").updateLayout($layout.fill)
                $(this.id + "-input").relayout()
            }
        })
    }

    cancel() {
        $(this.id + "-input").blur()
        $(this.id + "-input").text = ""
        this.onEndEditingAnimate()
        this.controller.callEvent("onCancel")
    }

    getView() {
        this.props = {
            id: this.id,
            smoothCorners: true,
            cornerRadius: 6
        }
        this.views = [
            {
                type: "input",
                props: {
                    id: this.id + "-input",
                    type: this.kbType,
                    bgcolor: $color("#EEF1F1", "#212121"),
                    placeholder: this.placeholder,
                    keyboardView: this.keyboardView,
                    accessoryView: this.accessoryView
                },
                layout: $layout.fill,
                events: Object.assign(
                    {
                        didBeginEditing: sender => {
                            this.onBeginEditingAnimate()
                            this.controller.callEvent("onBeginEditing", sender.text)
                        },
                        didEndEditing: sender => {
                            this.controller.callEvent("onEndEditing", sender.text)
                        },
                        changed: sender => this.controller.callEvent("onChange", sender.text),
                        returned: sender => this.controller.callEvent("onReturn", sender.text)
                    },
                    this.inputEvents
                )
            },
            {
                type: "button",
                props: {
                    id: this.id + "-cancel-button",
                    title: $l10n("CANCEL"),
                    font: this.cancelButtonFont,
                    titleColor: $color("tintColor"),
                    bgcolor: $color("clear"),
                    alpha: 0,
                    hidden: false
                },
                events: {
                    tapped: () => this.cancel()
                },
                layout: (make, view) => {
                    make.height.equalTo(view.super)
                    make.width.equalTo(this.cancelButtonWidth)
                    make.left.equalTo(view.super.right)
                }
            }
        ]
        this.layout = (make, view) => {
            make.height.equalTo(this.height)
            make.top.equalTo(view.super.safeArea).offset(this.topOffset)
            make.left.equalTo(view.super.safeArea).offset(this.horizontalOffset)
            make.right.equalTo(view.super.safeArea).offset(-this.horizontalOffset)
        }

        return this
    }
}

class SearchBarController extends Controller {
    setSearchBar(searchBar) {
        this.searchBar = searchBar
        return this
    }

    updateSelector() {
        this.selector = {
            inputBox: $(this.searchBar.id),
            input: $(this.searchBar.id + "-input")
        }
    }

    hide() {
        this.updateSelector()
        this.selector.inputBox.updateLayout(make => {
            make.height.equalTo(0)
        })
    }

    show() {
        this.updateSelector()
        this.selector.inputBox.updateLayout(make => {
            make.height.equalTo(this.searchBar.height)
        })
    }

    didScroll(contentOffset) {
        this.updateSelector()

        // 调整大小
        let height = this.searchBar.height - contentOffset
        height = height > 0 ? (height > this.searchBar.height ? this.searchBar.height : height) : 0
        this.selector.inputBox.updateLayout(make => {
            make.height.equalTo(height)
        })
        // 隐藏内容
        if (contentOffset > 0) {
            const alpha = (this.searchBar.height / 2 - 5 - contentOffset) / 10
            this.selector.input.alpha = alpha
        } else {
            this.selector.input.alpha = 1
        }
    }

    didEndDragging(contentOffset, decelerate, scrollToOffset) {
        this.updateSelector()

        if (contentOffset >= 0 && contentOffset <= this.searchBar.height) {
            scrollToOffset($point(0, contentOffset >= this.searchBar.height / 2 ? this.searchBar.height : 0))
        }
    }
}

module.exports = {
    SearchBar,
    SearchBarController
}
