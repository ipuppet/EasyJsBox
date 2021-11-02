class Controller {
    constructor(data) {
        Object.assign(this, data)
        this.dataCenter.set("id", this.args.id)
        this.dataCenter.set("title", this.args.title)
        this.dataCenter.set("rightButtons", this.args.rightButtons ?? [])
        this.dataCenter.set("leftButtons", this.args.leftButtons ?? [])
        this.dataCenter.set("backgroundColor", this.args.backgroundColor)
        this.dataCenter.set("headerHeight", this.args.headerHeight ?? 90)
        this.dataCenter.set("hasButton", this.args.rightButtons?.length || this.args.leftButtons?.length)
    }

    setHeaderHeight(height) {
        this.dataCenter.set("headerHeight", height)
    }

    setId(id) {
        this.dataCenter.set("id", id)
    }

    setTitle(title) {
        this.dataCenter.set("title", title)
    }

    setRightButtons(rightButtons) {
        this.dataCenter.set("rightButtons", rightButtons)
        this.dataCenter.set("hasbutton", true)
    }

    setLeftButtons(leftButtons) {
        this.dataCenter.set("leftButtons", leftButtons)
        this.dataCenter.set("hasbutton", true)
    }

    setBackgroundColor(backgroundColor) {
        this.dataCenter.set("backgroundColor", backgroundColor)
    }
}

class View {
    constructor(data) {
        Object.assign(this, data)
    }

    /**
     * 用于创建一个靠右侧按钮（自动布局）
     * @param {String} id 不可重复
     * @param {String} symbol symbol图标（目前只用symbol）
     * @param {CallableFunction} tapped 按钮点击事件，会传入三个函数，start()、done()和cancel()
     *     调用 start() 表明按钮被点击，准备开始动画
     *     调用 done() 表明您的操作已经全部完成，默认操作成功完成，播放一个按钮变成对号的动画
     *                 若第一个参数传出false则表示运行出错
     *                 第二个参数为错误原因($ui.toast(message))
     *      调用 cancel() 表示取消操作
     *     示例：
     *      (start, done, cancel) => {
     *          start()
     *          const upload = (data) => { return false }
     *          if(upload(data)) { done() }
     *          else { done(false, "Upload Error!") }
     *      }
     * @param {Boolean} hidden 是否隐藏
     * @param {String} alignRight 是否向右对齐，false 则向左对齐
     */
    navButton(id, symbol, tapped, hidden = false, alignRight = true) {
        const actionStart = () => {
            // 隐藏button，显示spinner
            const button = $(id)
            button.alpha = 0
            button.hidden = true
            $("spinner-" + id).alpha = 1
        }

        const actionDone = (status = true, message = $l10n("ERROR")) => {
            $("spinner-" + id).alpha = 0
            const button = $(id)
            button.hidden = false
            if (!status) { // 失败
                $ui.toast(message)
                button.alpha = 1
                return
            }
            // 成功动画
            button.symbol = "checkmark"
            $ui.animate({
                duration: 0.6,
                animation: () => {
                    button.alpha = 1
                },
                completion: () => {
                    setTimeout(() => {
                        $ui.animate({
                            duration: 0.4,
                            animation: () => {
                                button.alpha = 0
                            },
                            completion: () => {
                                button.symbol = symbol
                                $ui.animate({
                                    duration: 0.4,
                                    animation: () => {
                                        button.alpha = 1
                                    },
                                    completion: () => {
                                        button.alpha = 1
                                    }
                                })
                            }
                        })
                    }, 600)
                }
            })
        }

        const actionCancel = () => {
            $("spinner-" + id).alpha = 0
            const button = $(id)
            button.alpha = 1
            button.hidden = false
        }

        return {
            type: "view",
            props: { id: id },
            views: [
                {
                    type: "button",
                    props: {
                        id: id,
                        hidden: hidden,
                        tintColor: this.UIKit.textColor,
                        symbol: symbol,
                        contentEdgeInsets: $insets(0, 0, 0, 0),
                        imageEdgeInsets: $insets(0, 0, 0, 0),
                        bgcolor: $color("clear")
                    },
                    events: {
                        tapped: sender => {
                            tapped({
                                start: actionStart,
                                done: actionDone,
                                cancel: actionCancel
                            }, sender)
                        }
                    },
                    layout: $layout.fill
                },
                {
                    type: "spinner",
                    props: {
                        id: "spinner-" + id,
                        loading: true,
                        alpha: 0
                    },
                    layout: $layout.fill
                }
            ],
            layout: (make, view) => {
                make.height.equalTo(view.super)
                make.width.equalTo(40)
                if (view.prev && view.prev.id !== "label" && view.prev.id !== undefined) {
                    if (alignRight) make.right.equalTo(view.prev.left)
                    else make.left.equalTo(view.prev.right)
                } else {
                    if (alignRight) make.right.inset(0)
                    else make.left.inset(0)
                }
            }
        }
    }

    /**
     * 页面标题
     * @param {String} id 标题id
     * @param {String} title 标题文本
     * @param {Number} height 高度
     */
    headerTitle() {
        const id = this.dataCenter.get("id")
        const title = this.dataCenter.get("title")
        const headerHeight = this.dataCenter.get("headerHeight")
        return {
            type: "view",
            info: { id: id, title: title }, // 供动画使用
            props: { height: headerHeight },
            views: [{
                type: "label",
                props: {
                    id: id,
                    text: title,
                    textColor: this.UIKit.textColor,
                    align: $align.left,
                    font: $font("bold", 35),
                    line: 1
                },
                layout: (make, view) => {
                    make.left.equalTo(view.super.safeArea).offset(20)
                    make.top.equalTo(view.super.safeAreaTop).offset(50)
                }
            }]
        }
    }

    navBarView() {
        const buttonWidth = 60
        const id = this.dataCenter.get("id")
        const title = this.dataCenter.get("title")
        const backgroundColor = this.dataCenter.get("backgroundColor")
        const rightButtons = this.dataCenter.get("rightButtons")
        const leftButtons = this.dataCenter.get("leftButtons")
        const rightButtonView = rightButtons.length > 0 ? {
            type: "view",
            views: [{
                type: "view",
                views: rightButtons,
                layout: $layout.fill
            }],
            layout: (make, view) => {
                make.top.equalTo(view.super.safeAreaTop)
                make.bottom.equalTo(view.super.safeAreaTop).offset(50)
                make.right.inset(10)
                make.width.equalTo(rightButtons.length * buttonWidth)
            }
        } : {}
        const leftButtonView = leftButtons.length > 0 ? {
            type: "view",
            views: [{
                type: "view",
                views: leftButtons,
                layout: $layout.fill
            }],
            layout: (make, view) => {
                make.top.equalTo(view.super.safeAreaTop)
                make.bottom.equalTo(view.super.safeAreaTop).offset(50)
                make.left.inset(10)
                make.width.equalTo(rightButtons.length * buttonWidth)
            }
        } : {}
        return { // 顶部bar，用于显示 设置 字样
            type: "view",
            props: {
                id: id + "-header",
                bgcolor: $color("clear")
            },
            layout: (make, view) => {
                make.left.top.right.inset(0)
                make.bottom.equalTo(view.super.safeAreaTop).offset(45)
            },
            views: [
                backgroundColor ? {
                    type: "view",
                    props: {
                        hidden: true,
                        bgcolor: backgroundColor,
                        id: id + "-background"
                    },
                    layout: $layout.fill
                } : {
                    type: "blur",
                    props: {
                        hidden: true,
                        style: this.UIKit.blurStyle,
                        id: id + "-background"
                    },
                    layout: $layout.fill
                },
                this.UIKit.underline({
                    id: id + "-underline",
                    alpha: 0
                }),
                { // 标题
                    type: "label",
                    props: {
                        id: id + "-header-title",
                        alpha: 0,
                        text: title,
                        font: $font("bold", 17),
                        align: $align.center,
                        bgcolor: $color("clear"),
                        textColor: this.UIKit.textColor
                    },
                    layout: (make, view) => {
                        make.left.right.inset(0)
                        make.top.equalTo(view.super.safeAreaTop)
                        make.bottom.equalTo(view.super)
                    }
                }
            ].concat(rightButtonView, leftButtonView)
        }
    }

    scrollAction(sender) {
        // 样式
        const titleSizeMax = 40, // 下拉放大字体最大值
            topOffset = -10,
            // ID & Suffix
            id = this.dataCenter.get("id"),
            underlineIdSuffix = "-underline",
            backgroundIdSuffix = "-background",
            navTitleIdSuffix = "-header-title"
        // 顶部信息栏
        if (sender.contentOffset.y > 5) {
            $ui.animate({
                duration: 0.2,
                animation: () => {
                    $(id + underlineIdSuffix).alpha = 1
                    $(id + backgroundIdSuffix).hidden = false
                }
            })
            if (sender.contentOffset.y > 40) {
                $ui.animate({
                    duration: 0.2,
                    animation: () => {
                        $(id + navTitleIdSuffix).alpha = 1
                        $(id).alpha = 0
                    }
                })
            } else {
                $ui.animate({
                    duration: 0.2,
                    animation: () => {
                        $(id + navTitleIdSuffix).alpha = 0
                        $(id).alpha = 1
                    }
                })
            }
        } else {
            // 下拉放大字体
            if (sender.contentOffset.y <= topOffset) {
                let size = 35 - sender.contentOffset.y * 0.04
                if (size > titleSizeMax)
                    size = titleSizeMax
                $(id).font = $font("bold", size)
            }
            // 隐藏下划线和模糊
            $ui.animate({
                duration: 0.2,
                animation: () => {
                    $(id + underlineIdSuffix).alpha = 0
                    $(id + backgroundIdSuffix).hidden = true
                }
            })
        }
    }
}

module.exports = { Controller, View }