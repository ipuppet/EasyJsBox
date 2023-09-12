const { Controller } = require("../controller")
const { View, PageView } = require("../view")
const { ValidationError } = require("../validation-error")
const { Kernel } = require("../kernel")
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
class NavigationView extends Controller {
    /**
     * @type {PageView}
     */
    page

    navigationController = new NavigationBarController()
    navigationBar = new NavigationBar()
    navigationBarItems = new NavigationBarItems()

    constructor() {
        super()
        this.navigationBar.navigationBarItems = this.navigationBarItems
        this.navigationController.navigationBar = this.navigationBar
    }

    navigationBarTitle(title) {
        this.navigationBar.setTitle(title)
        return this
    }

    /**
     *
     * @param {object} view
     * @returns {this}
     */
    setView(view) {
        if (typeof view !== "object") {
            throw new NavigationViewTypeError("view", "object")
        }
        this.view = View.create(view)
        return this
    }

    getTopOffset() {
        if (!(this.view instanceof View)) {
            throw new NavigationViewTypeError("view", "View")
        }

        const scrollView = this.view.scrollableView
        const topSafeAreaInsets = $app.isDebugging ? 0 : UIKit.topSafeAreaInsets
        const navigationBarHeight =
            this.navigationBar.largeTitleDisplayMode === NavigationBar.largeTitleDisplayModeNever
                ? this.navigationBar.navigationBarNormalHeight
                : this.navigationBar.navigationBarLargeTitleHeight

        // 计算偏移高度
        let height = this.navigationBar.contentViewHeightOffset + navigationBarHeight
        if (this.navigationBarItems.titleView) {
            height += this.navigationBarItems.titleView.topOffset
            height += this.navigationBarItems.titleView.height
            height += this.navigationBarItems.titleView.bottomOffset
        }

        // 非滚动视图
        // 对于子视图可滚动的项目，必须手动指定滚动视图 props.associateWithNavigationBar 为 false 才会跳过绑定
        if (!this.view.scrollable || scrollView.props.associateWithNavigationBar === false) {
            let topOffset = height - this.navigationBar.contentViewHeightOffset
            if ((!UIKit.isHorizontal || UIKit.isLargeScreen) && this.navigationBar.topSafeArea) {
                topOffset += topSafeAreaInsets
            }
            return topOffset
        }

        if (scrollView.props.stickyHeader) {
            height -= navigationBarHeight
            height += this.navigationBar.largeTitleFontHeight
        }
        return height
    }

    getBottomOffset() {
        return this.navigationBarItems.fixedFooterView?.height ?? 0
    }

    #bindScrollEvents() {
        if (!(this.view instanceof View)) {
            throw new NavigationViewTypeError("view", "View")
        }

        const scrollView = this.view.scrollableView
        const topSafeAreaInsets = $app.isDebugging ? 0 : UIKit.topSafeAreaInsets

        // 计算偏移高度
        const height = this.getTopOffset()

        // 非滚动视图
        // 对于子视图可滚动的项目，必须手动指定滚动视图 props.associateWithNavigationBar 为 false 才会跳过绑定
        if (!this.view.scrollable || scrollView.props.associateWithNavigationBar === false) {
            this.view.layout = (make, view) => {
                make.left.right.equalTo(view.super.safeArea)
                make.bottom.equalTo(view.super)
                make.top.equalTo(height)
            }
            return
        }

        // indicatorInsets
        const pinTitleViewOffset = this.navigationBarItems.isPinTitleView
            ? this.navigationBarItems.titleView.height +
              this.navigationBarItems.titleView.bottomOffset +
              this.navigationBar.contentViewHeightOffset
            : 0
        if (scrollView.props.indicatorInsets) {
            const old = scrollView.props.indicatorInsets
            scrollView.props.indicatorInsets = $insets(
                old.top + this.navigationBar.navigationBarNormalHeight + pinTitleViewOffset,
                old.left,
                old.bottom + this.getBottomOffset(),
                old.right
            )
        } else {
            scrollView.props.indicatorInsets = $insets(
                this.navigationBar.navigationBarNormalHeight + pinTitleViewOffset,
                0,
                this.navigationBarItems.fixedFooterView?.height ?? 0,
                0
            )
        }

        // contentInset
        if (scrollView.props.contentInset) {
            const old = scrollView.props.contentInset
            scrollView.props.contentInset = $insets(
                old.top + height + pinTitleViewOffset,
                old.left,
                old.bottom + this.getBottomOffset(),
                old.right
            )
        } else {
            scrollView.props.contentInset = $insets(
                height + pinTitleViewOffset,
                0,
                this.navigationBarItems.fixedFooterView?.height ?? 0,
                0
            )
        }

        scrollView.props.contentOffset = $point(0, -height)

        // layout
        scrollView.layout = (make, view) => {
            if (scrollView.props.stickyHeader) {
                make.top.equalTo(view.super.safeArea).offset(this.navigationBar.navigationBarNormalHeight)
            } else {
                make.top.equalTo(view.super)
            }
            make.left.right.equalTo(view.super.safeArea)
            make.bottom.equalTo(view.super)
        }

        // 重写滚动事件
        scrollView
            .assignEvent("didScroll", sender => {
                let contentOffset = sender.contentOffset.y
                if (
                    (!UIKit.isHorizontal || UIKit.isLargeScreen) &&
                    this.navigationBar.topSafeArea &&
                    !scrollView.props.stickyHeader
                ) {
                    contentOffset += topSafeAreaInsets
                }
                contentOffset += height
                this.navigationController.didScroll(contentOffset)
            })
            .assignEvent("didEndDragging", (sender, decelerate) => {
                let contentOffset = sender.contentOffset.y
                let zeroOffset = 0
                if (
                    (!UIKit.isHorizontal || UIKit.isLargeScreen) &&
                    this.navigationBar.topSafeArea &&
                    !scrollView.props.stickyHeader
                ) {
                    contentOffset += topSafeAreaInsets
                    zeroOffset = topSafeAreaInsets
                }
                contentOffset += height
                zeroOffset += height
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
                scrollView.events?.didEndDragging(...args)
            })
    }

    #initPage() {
        if (this.navigationBar.prefersLargeTitles) {
            this.#bindScrollEvents()

            let titleView = {}
            if (this.navigationBarItems.titleView) {
                // 修改 titleView 背景与 navigationBar 相同
                const isHideBackground =
                    this.navigationBar.largeTitleDisplayMode === NavigationBar.largeTitleDisplayModeNever ? 1 : 0
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
            this.page = PageView.createFromViews([
                this.view,
                this.navigationBar.getLargeTitleView(),
                titleView,
                this.navigationBar.getNavigationBarView(),
                this.navigationBarItems.fixedFooterView?.definition ?? {}
            ])
        } else {
            this.page = PageView.createFromViews([this.view])
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
