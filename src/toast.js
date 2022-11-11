const { UIKit } = require("./ui-kit")

class Toast {
    static Type = {
        info: undefined,
        success: "checkmark",
        warning: "excalmationmark.triangle",
        error: "xmark"
    }
    static font = $font("default", 26)
    static edges = 40
    static iconSize = 100
    static labelTopMargin = 10
    static width = Math.min(UIKit.windowSize.width * 0.6, 260)

    id = $text.uuid

    #message = ""
    type = Toast.Type.info

    constructor(message, type = Toast.Type.info) {
        // 先确定类型，用于高度计算
        this.type = type
        this.message = message
    }

    get message() {
        return this.#message
    }

    set message(message) {
        this.#message = message
        this.fontHeight = UIKit.getContentSize(Toast.font, this.message, Toast.width).height
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
                    font: Toast.font,
                    text: this.message,
                    align: $align.center,
                    color: $color("lightGray")
                },
                layout: (make, view) => {
                    make.bottom.equalTo(view.supper).offset(-Toast.edges)
                    make.width.equalTo(Toast.width - Toast.edges * 2)
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
            make.size.equalTo($size(Toast.width, this.height))
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

    static toast(message, type = Toast.Type.info, displayTime = 3) {
        const toast = new Toast(message, type)

        toast.show()
        $delay(displayTime, () => {
            toast.remove()
        })
    }
    static info(message, displayTime) {
        Toast.toast(message, Toast.Type.info, displayTime)
    }
    static success(message, displayTime) {
        Toast.toast(message, Toast.Type.success, displayTime)
    }
    static warning(message, displayTime) {
        Toast.toast(message, Toast.Type.warning, displayTime)
    }
    static error(message, displayTime) {
        Toast.toast(message, Toast.Type.error, displayTime)
    }
}

module.exports = { Toast }
