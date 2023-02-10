const { UIKit } = require("./ui-kit")

class Toast {
    static type = {
        info: undefined,
        success: "checkmark",
        warning: "exclamationmark.triangle",
        error: "xmark.circle"
    }
    static edges = 40
    static iconSize = 100
    static labelTopMargin = 10
    static defaultFont = $font("default", 26)

    width = Math.min(UIKit.windowSize.width * 0.6, 260)
    labelWidth = this.width - Toast.edges * 2

    id = $text.uuid

    #message = ""
    font = undefined
    type = Toast.type.info
    labelLines = 2

    constructor(message, type = Toast.type.info, labelLines = 2, font = Toast.defaultFont) {
        // 先确定类型，用于高度计算
        this.type = type
        this.message = message
        this.labelLines = labelLines
        this.font = font
    }

    get message() {
        return this.#message
    }

    set message(message) {
        this.#message = message
        this.fontHeight = UIKit.getContentSize(this.font, this.message, this.labelWidth, this.labelLines).height
        this.height = (this.hasIcon ? Toast.labelTopMargin + Toast.iconSize : 0) + this.fontHeight + Toast.edges * 2
    }

    get hasIcon() {
        return this.type !== undefined
    }

    get blurBox() {
        const blurBox = UIKit.blurBox({ id: this.id, cornerRadius: 15, alpha: 0 }, [
            {
                type: "image",
                props: {
                    symbol: this.type,
                    hidden: !this.hasIcon,
                    tintColor: $color("lightGray")
                },
                layout: (make, view) => {
                    make.top.inset(Toast.edges)
                    make.size.equalTo(Toast.iconSize)
                    make.centerX.equalTo(view.super)
                }
            },
            {
                type: "label",
                props: {
                    font: this.font,
                    text: this.message,
                    align: $align.center,
                    lines: this.labelLines,
                    color: $color("lightGray")
                },
                layout: (make, view) => {
                    make.bottom.equalTo(view.supper).offset(-Toast.edges)
                    make.width.equalTo(this.labelWidth)
                    make.height.equalTo(this.fontHeight)
                    make.centerX.equalTo(view.super)
                }
            }
        ])
        blurBox.events = {
            tapped: () => {
                this.remove()
            }
        }

        return blurBox
    }

    show() {
        $ui.controller.view.insertAtIndex($ui.create(this.blurBox), 0)
        const toast = $(this.id)
        toast.layout((make, view) => {
            make.center.equalTo(view.super)
            make.size.equalTo($size(this.width, this.height))
        })
        toast.moveToFront()
        $ui.animate({
            duration: 0.2,
            animation: () => {
                toast.alpha = 1
            }
        })
    }

    remove() {
        const toast = $(this.id)
        if (!toast) return
        $ui.animate({
            duration: 0.2,
            animation: () => {
                toast.alpha = 0
            },
            completion: () => {
                toast.remove()
            }
        })
    }

    static toast({ message, type = Toast.type.info, displayTime = 2, labelLines = 2, font = Toast.defaultFont }) {
        const toast = new Toast(message, type, labelLines, font)

        toast.show()
        $delay(displayTime, () => {
            toast.remove()
        })

        return toast
    }
    static info(message, opts = {}) {
        return Toast.toast(Object.assign({ message, type: Toast.type.info }, opts))
    }
    static success(message, opts = {}) {
        return Toast.toast(Object.assign({ message, type: Toast.type.success }, opts))
    }
    static warning(message, opts = {}) {
        return Toast.toast(Object.assign({ message, type: Toast.type.warning }, opts))
    }
    static error(message, opts = {}) {
        return Toast.toast(Object.assign({ message, type: Toast.type.error }, opts))
    }
}

module.exports = { Toast }
