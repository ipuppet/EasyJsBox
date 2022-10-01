const { View, PageView } = require("../view")
const { ValidationError } = require("../validation-error")
const { UIKit } = require("../ui-kit")

const { NavigationBar, NavigationBarController } = require("./navigation-bar")
const { NavigationBarItems } = require("./navigation-bar-items")

class NavigationViewTypeError extends ValidationError {
    constructor(parameter, type) {
        super(parameter, type)
        this.name = "NavigationViewTypeError"
    }
}

/**
 * @typedef {NavigationView} NavigationView
 */
class NavigationView {
    /**
     * @type {PageView}
     */
    page

    navigationController = new NavigationBarController()
    navigationBar = new NavigationBar()
    navigationBarItems = new NavigationBarItems()

    constructor() {
        this.navigationBar.navigationBarItems = this.navigationBarItems
        this.navigationController.navigationBar = this.navigationBar
    }

    navigationBarTitle(title) {
        this.navigationBar.setTitle(title)
        return this
    }

    /**
     *
     * @param {Object} view
     * @returns {this}
     */
    setView(view) {
        if (typeof view !== "object") {
            throw new NavigationViewTypeError("view", "object")
        }
        this.view = View.create(view)
        return this
    }

    #bindScrollEvents() {
        if (!(this.view instanceof View)) {
            throw new NavigationViewTypeError("view", "View")
        }

        // 计算偏移高度
        let height = this.navigationBar.contentViewHeightOffset
        if (this.navigationBarItems.titleView) {
            height += this.navigationBarItems.titleView.topOffset
            height += this.navigationBarItems.titleView.height
            height += this.navigationBarItems.titleView.bottomOffset
        }
        if (this.view.props.stickyHeader) {
            height += this.navigationBar.largeTitleFontHeight
        } else {
            if (this.navigationBar.largeTitleDisplayMode === NavigationBar.largeTitleDisplayModeNever) {
                height += this.navigationBar.navigationBarNormalHeight
            } else {
                height += this.navigationBar.navigationBarLargeTitleHeight
            }
        }

        // 修饰视图顶部偏移
        if (this.view.props.header) {
            this.view.props.header = {
                type: "view",
                props: {
                    height: height + (this.view.props.header?.props?.height ?? 0)
                },
                views: [
                    {
                        type: "view",
                        props: { clipsToBounds: true },
                        views: [this.view.props.header],
                        layout: (make, view) => {
                            make.top.equalTo(height)
                            make.bottom.width.equalTo(view.super)
                        }
                    }
                ]
            }
        } else {
            this.view.props.header = { props: { height: height } }
        }

        // 修饰视图底部偏移
        this.view.props.footer = Object.assign({ props: {} }, this.view.props.footer ?? {})
        this.view.props.footer.props.height =
            (this.navigationBarItems.fixedFooterView?.height ?? 0) + (this.view.props.footer.props?.height ?? 0)

        // 重写布局
        if (UIKit.scrollViewList.indexOf(this.view.type) === -1) {
            // 非滚动视图
            this.view.layout = (make, view) => {
                make.left.right.equalTo(view.super.safeArea)
                make.bottom.equalTo(view.super)
                let topOffset = this.navigationBar.contentViewHeightOffset
                if (this.navigationBar.largeTitleDisplayMode !== NavigationBar.largeTitleDisplayModeNever) {
                    topOffset += this.navigationBar.largeTitleFontHeight
                }
                if (this.navigationBarItems.titleView) {
                    topOffset +=
                        this.navigationBarItems.titleView.topOffset + this.navigationBarItems.titleView.bottomOffset
                }
                if ((!UIKit.isHorizontal || UIKit.isLargeScreen) && this.navigationBar.addStatusBarHeight) {
                    topOffset += UIKit.statusBarHeight
                }
                make.top.equalTo(this.navigationBar.navigationBarNormalHeight + topOffset)
            }
        } else {
            // indicatorInsets
            const pinTitleViewOffset = this.navigationBarItems.isPinTitleView
                ? this.navigationBarItems.titleView.height +
                  this.navigationBarItems.titleView.bottomOffset +
                  this.navigationBar.contentViewHeightOffset
                : 0
            if (this.view.props.indicatorInsets) {
                const old = this.view.props.indicatorInsets
                this.view.props.indicatorInsets = $insets(
                    old.top + this.navigationBar.navigationBarNormalHeight + pinTitleViewOffset,
                    old.left,
                    old.bottom + (this.navigationBarItems.fixedFooterView?.height ?? 0),
                    old.right
                )
            } else {
                this.view.props.indicatorInsets = $insets(
                    this.navigationBar.navigationBarNormalHeight + pinTitleViewOffset,
                    0,
                    this.navigationBarItems.fixedFooterView?.height ?? 0,
                    0
                )
            }

            // layout
            this.view.layout = (make, view) => {
                if (this.view.props.stickyHeader) {
                    make.top.equalTo(view.super.safeArea).offset(this.navigationBar.navigationBarNormalHeight)
                } else {
                    make.top.equalTo(view.super)
                }
                make.left.right.equalTo(view.super.safeArea)
                make.bottom.equalTo(view.super)
            }

            // 重写滚动事件
            this.view
                .assignEvent("didScroll", sender => {
                    let contentOffset = sender.contentOffset.y
                    if (
                        (!UIKit.isHorizontal || UIKit.isLargeScreen) &&
                        this.navigationBar.addStatusBarHeight &&
                        !this.view.props.stickyHeader
                    ) {
                        contentOffset += UIKit.statusBarHeight
                    }
                    this.navigationController.didScroll(contentOffset)
                })
                .assignEvent("didEndDragging", (sender, decelerate) => {
                    let contentOffset = sender.contentOffset.y
                    let zeroOffset = 0
                    if (
                        (!UIKit.isHorizontal || UIKit.isLargeScreen) &&
                        this.navigationBar.addStatusBarHeight &&
                        !this.view.props.stickyHeader
                    ) {
                        contentOffset += UIKit.statusBarHeight
                        zeroOffset = UIKit.statusBarHeight
                    }
                    this.navigationController.didEndDragging(
                        contentOffset,
                        decelerate,
                        (...args) => sender.scrollToOffset(...args),
                        zeroOffset
                    )
                })
                .assignEvent("didEndDecelerating", (...args) => {
                    if (args[0].tracking) {
                        return
                    }
                    this.view.events?.didEndDragging(...args)
                })
        }
    }

    #initPage() {
        if (this.navigationBar.prefersLargeTitles) {
            this.#bindScrollEvents()

            let titleView = {}
            if (this.navigationBarItems.titleView) {
                // 修改 titleView 背景与 navigationBar 相同
                const isHideBackground = this.navigationBar.prefersLargeTitles ? 0 : 1
                titleView = View.create({
                    views: [
                        this.navigationBar.backgroundColor
                            ? {
                                  type: "view",
                                  props: {
                                      alpha: isHideBackground,
                                      bgcolor: this.navigationBar.backgroundColor,
                                      id: this.navigationBar.id + "-title-view-background"
                                  },
                                  layout: $layout.fill
                              }
                            : UIKit.blurBox({
                                  alpha: isHideBackground,
                                  id: this.navigationBar.id + "-title-view-background"
                              }),
                        UIKit.separatorLine({
                            id: this.navigationBar.id + "-title-view-underline",
                            alpha: isHideBackground
                        }),
                        this.navigationBarItems.titleView.definition
                    ],
                    layout: (make, view) => {
                        make.top.equalTo(view.prev.bottom)
                        make.width.equalTo(view.super)
                        make.height.equalTo(
                            this.navigationBarItems.titleView.topOffset +
                                this.navigationBarItems.titleView.height +
                                this.navigationBarItems.titleView.bottomOffset
                        )
                    }
                })
            }

            // 初始化 PageView
            this.page = PageView.createByViews([
                this.view,
                this.navigationBar.getLargeTitleView(),
                titleView,
                this.navigationBar.getNavigationBarView(),
                this.navigationBarItems.fixedFooterView?.definition ?? {}
            ])
        } else {
            this.page = PageView.createByViews([this.view])
        }
        if (this.view.props?.bgcolor) {
            this.page.setProp("bgcolor", this.view.props.bgcolor)
        } else {
            this.page.setProp("bgcolor", UIKit.defaultBackgroundColor(this.view.type))
        }
    }

    getPage() {
        if (!this.page) {
            this.#initPage()
        }
        return this.page
    }
}

module.exports = {
    NavigationView
}
