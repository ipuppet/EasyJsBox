const { isTaio } = require("./kernel")

class UIKit {
    static #sharedApplication = $objc("UIApplication").$sharedApplication()

    /**
     * 对齐方式
     */
    static align = { left: 0, right: 1, top: 2, bottom: 3 }

    /**
     * 默认文本颜色
     */
    static textColor = $color("primaryText", "secondaryText")

    /**
     * 默认链接颜色
     */
    static linkColor = $color("systemLink")
    static primaryViewBackgroundColor = $color("primarySurface")
    static scrollViewBackgroundColor = $color("insetGroupedBackground")

    /**
     * 可滚动视图列表
     * @type {string[]}
     */
    static scrollViewList = ["list", "matrix"]

    /**
     * 是否属于大屏设备
     * @type {boolean}
     */
    static isLargeScreen = $device.isIpad || $device.isIpadPro

    /**
     * 获取Window大小
     */
    static get windowSize() {
        return $objc("UIWindow").$keyWindow().jsValue().size
    }

    static NavigationBarNormalHeight = $objc("UINavigationController").invoke("alloc.init").$navigationBar().jsValue()
        .frame.height
    static NavigationBarLargeTitleHeight =
        $objc("UITabBarController").invoke("alloc.init").$tabBar().jsValue().frame.height +
        UIKit.NavigationBarNormalHeight

    /**
     * 判断是否是分屏模式
     * @type {boolean}
     */
    static get isSplitScreenMode() {
        return UIKit.isLargeScreen && $device.info.screen.width !== UIKit.windowSize.width
    }

    static get statusBarHeight() {
        return $app.isDebugging || isTaio ? 0 : UIKit.#sharedApplication.$statusBarFrame().height
    }

    static get statusBarOrientation() {
        return UIKit.#sharedApplication.$statusBarOrientation()
    }

    static get isHorizontal() {
        return UIKit.statusBarOrientation === 3 || UIKit.statusBarOrientation === 4
    }

    static loading() {
        const loading = $ui.create(
            UIKit.blurBox(
                {
                    cornerRadius: 15
                },
                [
                    {
                        type: "spinner",
                        props: {
                            loading: true,
                            style: 0
                        },
                        layout: (make, view) => {
                            make.size.equalTo(view.prev)
                            make.center.equalTo(view.super)
                        }
                    }
                ]
            )
        )

        return {
            start: () => {
                $ui.controller.view.insertAtIndex(loading, 0)
                loading.layout((make, view) => {
                    make.center.equalTo(view.super)
                    const width = Math.min(UIKit.windowSize.width * 0.6, 300)
                    make.size.equalTo($size(width, width))
                })
                loading.moveToFront()
            },
            end: () => {
                loading.remove()
            }
        }
    }

    static defaultBackgroundColor(type) {
        return UIKit.scrollViewList.indexOf(type) > -1
            ? UIKit.scrollViewBackgroundColor
            : UIKit.primaryViewBackgroundColor
    }

    static separatorLine(props = {}, align = UIKit.align.bottom) {
        return {
            // canvas
            type: "canvas",
            props: props,
            layout: (make, view) => {
                if (view.prev === undefined) {
                    make.top.equalTo(view.super)
                } else if (align === UIKit.align.bottom) {
                    make.top.equalTo(view.prev.bottom)
                } else {
                    make.top.equalTo(view.prev.top)
                }
                make.height.equalTo(1 / $device.info.screen.scale)
                make.left.right.inset(0)
            },
            events: {
                draw: (view, ctx) => {
                    ctx.strokeColor = props.bgcolor ?? $color("separatorColor")
                    ctx.setLineWidth(1)
                    ctx.moveToPoint(0, 0)
                    ctx.addLineToPoint(view.frame.width, 0)
                    ctx.strokePath()
                }
            }
        }
    }

    static blurBox(props = {}, views = [], layout = $layout.fill) {
        return {
            type: "blur",
            props: Object.assign(
                {
                    style: $blurStyle.thinMaterial
                },
                props
            ),
            views: views,
            layout: layout
        }
    }

    /**
     * 建议仅在使用 JSBox nav 时使用，便于统一风格
     */
    static push({
        views,
        statusBarStyle = 0,
        title = "",
        navButtons = [{ title: "" }],
        bgcolor = views[0]?.props?.bgcolor ?? "primarySurface",
        disappeared
    } = {}) {
        $ui.push({
            props: {
                statusBarStyle: statusBarStyle,
                navButtons: navButtons,
                title: title,
                bgcolor: typeof bgcolor === "string" ? $color(bgcolor) : bgcolor
            },
            events: {
                disappeared: () => {
                    if (disappeared !== undefined) disappeared()
                }
            },
            views: [
                {
                    type: "view",
                    views: views,
                    layout: (make, view) => {
                        make.top.equalTo(view.super.safeArea)
                        make.bottom.equalTo(view.super)
                        make.left.right.equalTo(view.super.safeArea)
                    }
                }
            ]
        })
    }
}

module.exports = {
    UIKit
}