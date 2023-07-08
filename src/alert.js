const { UIKit } = require("./ui-kit")

class AlertAction {
    title
    handler

    constructor({ title = $l10n("OK"), disabled = false, style = $alertActionType.default, handler = () => {} } = {}) {
        this.title = title
        this.disabled = disabled
        this.style = style
        this.handler = handler
    }
}

class Alert {
    id = $text.uuid

    title
    message
    actions

    titleFont = $font("bold", 20)
    messageFont = $font(14)
    actionButtonFontSize = 16
    actionButtonHighlight = $color($rgba(0, 0, 0, 0.2), $rgba(255, 255, 255, 0.2))
    actionButtonHeight = 35
    actionButtonBoderWidth = 0.5
    actionButtonBorderColor = $color("#C9C9C9", "#383838")
    boxWidth = 250
    textVerticalMargin = 20
    textHorizontalMargin = 50

    constructor({ title = "", message = "", actions = [] } = {}) {
        this.title = title
        this.message = message
        this.actions = actions
        if (this.actions.length === 0) {
            this.actions.push(new AlertAction())
        }
        this.titleSize = UIKit.getContentSize(this.titleFont, this.title, this.boxWidth - this.textHorizontalMargin * 2)
        this.messageSize = UIKit.getContentSize(
            this.messageFont,
            this.message,
            this.boxWidth - this.textHorizontalMargin * 2
        )
    }

    textView() {
        return {
            type: "view",
            views: [
                {
                    type: "label",
                    props: {
                        lines: 0,
                        font: this.titleFont,
                        text: this.title,
                        color: $color("tint"),
                        align: $align.center
                    },
                    layout: (make, view) => {
                        make.centerX.equalTo(view.super)
                        make.width.equalTo(this.boxWidth - this.textHorizontalMargin * 2)
                        make.height.equalTo(this.titleSize.height)
                        make.top.equalTo(this.textVerticalMargin)
                    }
                },
                {
                    type: "label",
                    props: {
                        lines: 0,
                        font: this.messageFont,
                        text: this.message,
                        align: $align.center
                    },
                    layout: (make, view) => {
                        make.centerX.equalTo(view.super)
                        make.width.equalTo(this.boxWidth - this.textHorizontalMargin * 2)
                        make.height.equalTo(this.messageSize.height)
                        make.top.equalTo(view.prev.bottom)
                    }
                }
            ],
            layout: (make, view) => {
                make.top.width.equalTo(view.super)
                make.height.equalTo(this.titleSize.height + this.messageSize.height + this.textVerticalMargin * 2)
            }
        }
    }

    actionView() {
        /**
         *
         * @param {AlertAction} action
         * @param {number} i
         * @returns
         */
        const buttonView = (action, i) => {
            const touchInBox = location => {
                if (this.actions.length === 2) {
                    return (
                        location.y >= 0 &&
                        location.x >= 0 &&
                        location.y <= this.actionButtonHeight &&
                        location.x <= this.boxWidth / 2
                    )
                } else {
                    return (
                        location.y >= 0 &&
                        location.x >= 0 &&
                        location.y <= this.actionButtonHeight &&
                        location.x <= this.boxWidth
                    )
                }
            }
            const touchesEndedAndCancelled = async (sender, location, locations) => {
                if (action.disabled) return
                sender.bgcolor = $color("clear")
                // 判断是否响应点击事件
                if (touchInBox(location)) {
                    if (typeof action.handler === "function") {
                        await action.handler({ index: i, title: action.title })
                    }
                    this.dismiss()
                }
            }
            let color = $color("tint")
            let font = $font(this.actionButtonFontSize)
            if (action.disabled) {
                color = $color("gray")
            } else {
                if (action.style === $alertActionType.destructive) {
                    color = $color("red")
                } else if (action.style === $alertActionType.cancel) {
                    font = $font("bold", this.actionButtonFontSize)
                }
            }
            return {
                type: "label",
                props: {
                    lines: 1,
                    text: action.title,
                    align: $align.center,
                    font: font,
                    color: color,
                    borderWidth: this.actionButtonBoderWidth,
                    borderColor: this.actionButtonBorderColor,
                    bgcolor: $color("clear")
                },
                events: {
                    tapped: () => {},
                    touchesBegan: sender => {
                        if (action.disabled) return
                        sender.bgcolor = this.actionButtonHighlight
                    },
                    touchesEnded: touchesEndedAndCancelled,
                    touchesCancelled: touchesEndedAndCancelled,
                    touchesMoved: (sender, location, locations) => {
                        if (action.disabled) return
                        if (touchInBox(location)) {
                            sender.bgcolor = this.actionButtonHighlight
                        } else {
                            sender.bgcolor = $color("clear")
                        }
                    }
                },
                layout: (make, view) => {
                    if (this.actions.length === 2) {
                        if (view.prev) {
                            make.left.equalTo(view.prev.right).offset(-this.actionButtonBoderWidth)
                            make.width.equalTo(view.super).dividedBy(2).offset(this.actionButtonBoderWidth)
                        } else {
                            make.width.equalTo(view.super).dividedBy(2)
                        }
                    } else {
                        make.width.equalTo(view.super)
                        if (view.prev) {
                            make.top.equalTo(view.prev.bottom).offset(-this.actionButtonBoderWidth)
                        }
                    }
                    make.height.equalTo(this.actionButtonHeight)
                }
            }
        }
        return {
            type: "view",
            views: this.actions.map((action, i) => buttonView(action, i)),
            layout: (make, view) => {
                make.left.equalTo(view.super).offset(-this.actionButtonBoderWidth)
                make.width.equalTo(view.super).offset(this.actionButtonBoderWidth * 2)
                make.bottom.equalTo(view.super)
                make.top.equalTo(view.prev.bottom)
            }
        }
    }

    getView() {
        const boxView = {
            type: "view",
            props: {
                id: this.id + "-box",
                smoothCorners: true,
                cornerRadius: 20,
                bgcolor: $color("#FFFFFF", "#000000")
            },
            views: [this.textView(), this.actionView()],
            layout: (make, view) => {
                make.center.equalTo(view.super.safeArea)

                let height = this.titleSize.height + this.messageSize.height + this.textVerticalMargin * 2
                let length = this.actions.length > 2 ? this.actions.length : 1
                height += this.actionButtonHeight * length
                height -= this.actionButtonBoderWidth * length
                let width = this.boxWidth - this.actionButtonBoderWidth * 2
                make.size.equalTo($size(width, height))
            }
        }
        return {
            type: "view",
            props: {
                id: this.id,
                alpha: 0,
                bgcolor: $rgba(0, 0, 0, 0.6)
            },
            views: [boxView],
            layout: $layout.fill
        }
    }

    /**
     * 弹出 Alert
     */
    present() {
        const view = $ui.create(this.getView())
        if ($ui.controller.view.hidden) {
            $ui.controller.view.super.insertAtIndex(view, 0)
        } else {
            $ui.controller.view.insertAtIndex(view, 0)
        }
        const alert = $(this.id)
        alert.layout($layout.fill)
        alert.moveToFront()
        $ui.animate({
            duration: 0.3,
            animation: () => {
                alert.alpha = 1
            }
        })
    }

    /**
     * 关闭 Alert
     */
    dismiss() {
        const alert = $(this.id)
        $ui.animate({
            duration: 0.3,
            animation: () => {
                alert.alpha = 0
            },
            completion: () => {
                alert.remove()
            }
        })
    }

    static fromJsbox(object) {
        return new Promise((resolve, reject) => {
            const alert = new Alert({
                title: object.title,
                message: object.message,
                actions: object?.actions?.map(action => {
                    if (!action.handler) {
                        action.handler = res => {
                            resolve(res)
                        }
                    }
                    return new AlertAction(action)
                })
            })
            alert.present()
        })
    }
}

module.exports = {
    Alert,
    AlertAction
}
