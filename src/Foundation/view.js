class BaseView {
    constructor(kernel) {
        this.kernel = kernel
        // 通用样式
        this.blurStyle = $blurStyle.thinMaterial
        this.textColor = $color("primaryText", "secondaryText")
    }

    init() { }

    setController(controller) {
        this.controller = controller
    }

    setDataCenter(dataCenter) {
        this.dataCenter = dataCenter
    }

    /**
     * 是否属于大屏设备
     */
    isLargeScreen() {
        return $device.info.screen.width > 500
    }

    /**
     * 页面标题
     * @param {*} id 标题id
     * @param {*} title 标题文本
     */
    headerTitle(id, title) {
        return {
            type: "view",
            info: { id: id, title: title }, // 供动画使用
            props: {
                height: 90
            },
            views: [{
                type: "label",
                props: {
                    id: id,
                    text: title,
                    textColor: this.textColor,
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

    /**
     * 重新设计$ui.push()
     * @param {*} views 视图
     * @param {*} parentTitle 上级目录名称，显示在返回按钮旁边
     * @param {*} navButtons 右侧按钮，需要自己调整位置
     */
    push(views, parentTitle = $l10n("BACK"), navButtons = [], disappeared = undefined) {
        navButtons = navButtons.concat([
            {
                type: "button",
                props: {
                    symbol: "chevron.left",
                    tintColor: this.textColor,
                    bgcolor: $color("clear")
                },
                layout: make => {
                    make.left.inset(10)
                    make.size.equalTo(30)
                }
            },
            {
                type: "label",
                props: {
                    text: parentTitle,
                    textColor: this.textColor,
                    font: $font(18)
                },
                layout: (make, view) => {
                    make.height.equalTo(view.prev)
                    make.left.equalTo(view.prev.right)
                }
            },
            {
                type: "view",
                props: {
                    bgolor: $color("blue")
                },
                layout: (make, view) => {
                    make.height.equalTo(view.prev)
                    make.width.equalTo(view.prev).offset(20)
                    make.left.inset(10)
                },
                events: {
                    tapped: () => { $ui.pop() }
                }
            }
        ])
        $ui.push({
            props: {
                navBarHidden: true,
                statusBarStyle: 0
            },
            events: {
                disappeared: () => {
                    if (disappeared !== undefined) disappeared()
                },
                dealloc: () => {
                    if (disappeared !== undefined) disappeared()
                }
            },
            views: [
                {
                    type: "view",
                    props: { clipsToBounds: true },
                    layout: $layout.fillSafeArea,
                    views: [
                        {
                            type: "view",
                            views: navButtons,
                            layout: (make, view) => {
                                make.top.inset(20)
                                make.width.equalTo(view.super)
                                make.height.equalTo(20)
                            }
                        },
                        {
                            type: "view",
                            views: views,
                            layout: (make, view) => {
                                make.top.equalTo(view.prev).offset(40)
                                make.width.equalTo(view.super)
                                make.bottom.equalTo(view.super.safeAreaBottom)
                            }
                        }
                    ]
                }
            ]
        })
    }

    /**
     * 用于创建一个靠右侧按钮（自动布局）
     * @param {String} id 不可重复
     * @param {String} symbol symbol图标（目前只用symbol）
     * @param {CallableFunction} tapped 按钮点击事件，会传入两个函数，start()和done(status, message)
     *     调用 start() 表明按钮被点击，准备开始动画
     *     调用 done() 表明您的操作已经全部完成，默认操作成功完成，播放一个按钮变成对号的动画
     *                 若第一个参数传出false则表示运行出错
     *                 第二个参数为错误原因($ui.toast(message))
     *     示例：
     *      (start, done) => {
     *          start()
     *          const upload = (data) => { return false }
     *          if(upload(data)) { done() }
     *          else { done(false, "Upload Error!") }
     *      }
     */
    navButton(id, symbol, tapped) {
        let actionStart = () => {
            // 隐藏button，显示spinner
            $(id).alpha = 0
            $("spinner-" + id).alpha = 1
        }

        let actionDone = (status = true, message = $l10n("ERROR")) => {
            $("spinner-" + id).alpha = 0
            let button = $(id)
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
        return {
            type: "view",
            props: { id: id },
            views: [
                {
                    type: "button",
                    props: {
                        id: id,
                        tintColor: this.textColor,
                        symbol: symbol,
                        bgcolor: $color("clear")
                    },
                    events: {
                        tapped: () => {
                            tapped(actionStart, actionDone)
                        }
                    },
                    layout: (make, view) => {
                        make.size.equalTo(view.super)
                    }
                },
                {
                    type: "spinner",
                    props: {
                        id: "spinner-" + id,
                        loading: true,
                        alpha: 0
                    },
                    layout: (make, view) => {
                        make.size.equalTo(view.prev)
                    }
                }
            ],
            layout: (make, view) => {
                make.size.equalTo(20)
                if (view.prev) {
                    make.right.equalTo(view.prev.left).offset(-20)
                } else {
                    make.right.inset(20)
                }
            }
        }
    }
}

module.exports = BaseView