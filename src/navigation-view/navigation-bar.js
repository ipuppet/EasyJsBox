const { View } = require("../view")
const { Controller } = require("../controller")
const { UIKit } = require("../ui-kit")

const { BarButtonItem } = require("./navigation-bar-items")

/**
 * @typedef {import("./navigation-bar-items").NavigationBarItems} NavigationBarItems
 */

class NavigationBar extends View {
    static largeTitleDisplayModeAutomatic = 0
    static largeTitleDisplayModeAlways = 1
    static largeTitleDisplayModeNever = 2
    static pageSheetNavigationBarHeight = 56

    /**
     * @type {NavigationBarItems}
     */
    navigationBarItems

    title = ""

    prefersLargeTitles = true
    largeTitleDisplayMode = NavigationBar.largeTitleDisplayModeAutomatic

    largeTitleFontSize = 34
    largeTitleFontFamily = "bold"
    largeTitleFontHeight = $text.sizeThatFits({
        text: "A",
        width: 100,
        font: $font(this.largeTitleFontFamily, this.largeTitleFontSize)
    }).height
    navigationBarTitleFontSize = 17
    addStatusBarHeight = true
    contentViewHeightOffset = 10
    navigationBarNormalHeight = UIKit.NavigationBarNormalHeight
    navigationBarLargeTitleHeight = UIKit.NavigationBarLargeTitleHeight

    pageSheetMode() {
        this.navigationBarLargeTitleHeight -= this.navigationBarNormalHeight
        this.navigationBarNormalHeight = NavigationBar.pageSheetNavigationBarHeight
        this.navigationBarLargeTitleHeight += this.navigationBarNormalHeight
        this.addStatusBarHeight = false
        return this
    }

    withStatusBarHeight() {
        this.addStatusBarHeight = true
        return this
    }

    withoutStatusBarHeight() {
        this.addStatusBarHeight = false
        return this
    }

    setLargeTitleDisplayMode(mode) {
        this.largeTitleDisplayMode = mode
        return this
    }

    setBackgroundColor(backgroundColor) {
        this.backgroundColor = backgroundColor
        return this
    }

    setTitle(title) {
        this.title = title
        return this
    }

    setPrefersLargeTitles(bool) {
        this.prefersLargeTitles = bool
        return this
    }

    setContentViewHeightOffset(offset) {
        this.contentViewHeightOffset = offset
        return this
    }

    /**
     * 页面大标题
     */
    getLargeTitleView() {
        return this.prefersLargeTitles && this.largeTitleDisplayMode !== NavigationBar.largeTitleDisplayModeNever
            ? {
                  type: "label",
                  props: {
                      id: this.id + "-large-title",
                      text: this.title,
                      textColor: UIKit.textColor,
                      align: $align.left,
                      font: $font(this.largeTitleFontFamily, this.largeTitleFontSize),
                      line: 1
                  },
                  layout: (make, view) => {
                      make.left.equalTo(view.super.safeArea).offset(15)
                      make.height.equalTo(this.largeTitleFontHeight)
                      make.top.equalTo(view.super.safeAreaTop).offset(this.navigationBarNormalHeight)
                  }
              }
            : { props: { id: this.id + "-large-title" } }
    }

    getNavigationBarView() {
        const getButtonView = (buttons, align) => {
            return buttons.length > 0
                ? {
                      type: "view",
                      views: [
                          {
                              type: "view",
                              views: buttons,
                              layout: $layout.fill
                          }
                      ],
                      layout: (make, view) => {
                          make.top.equalTo(view.super.safeAreaTop)
                          make.bottom.equalTo(view.super.safeAreaTop).offset(this.navigationBarNormalHeight)
                          if (align === UIKit.align.left) make.left.equalTo(view.super.safeArea)
                          else make.right.equalTo(view.super.safeArea)
                          make.width.equalTo(buttons.length * BarButtonItem.size.width)
                      }
                  }
                : {}
        }
        const rightButtonView = getButtonView(this.navigationBarItems.rightButtons, UIKit.align.right)
        const leftButtonView =
            this.navigationBarItems.popButtonView ??
            getButtonView(this.navigationBarItems.leftButtons, UIKit.align.left)
        const isHideBackground = this.prefersLargeTitles
        const isHideTitle =
            !this.prefersLargeTitles || this.largeTitleDisplayMode === NavigationBar.largeTitleDisplayModeNever
        return {
            // 顶部 bar
            type: "view",
            props: {
                id: this.id + "-navigation",
                bgcolor: $color("clear")
            },
            layout: (make, view) => {
                make.left.top.right.inset(0)
                make.bottom.equalTo(view.super.safeAreaTop).offset(this.navigationBarNormalHeight)
            },
            views: [
                this.backgroundColor
                    ? {
                          type: "view",
                          props: {
                              hidden: isHideBackground,
                              bgcolor: this.backgroundColor,
                              id: this.id + "-background"
                          },
                          layout: $layout.fill
                      }
                    : UIKit.blurBox({
                          hidden: isHideBackground,
                          id: this.id + "-background"
                      }),
                UIKit.separatorLine({
                    id: this.id + "-underline",
                    alpha: isHideBackground ? 0 : 1
                }),
                {
                    type: "view",
                    props: {
                        alpha: 0,
                        bgcolor: $color("clear"),
                        id: this.id + "-large-title-mask"
                    },
                    events: {
                        ready: sender => {
                            sender.bgcolor = $(this.id + "-large-title")?.prev.bgcolor
                        }
                    },
                    layout: $layout.fill
                },
                {
                    // 标题
                    type: "label",
                    props: {
                        id: this.id + "-small-title",
                        alpha: isHideTitle ? 1 : 0, // 不显示大标题则显示小标题
                        text: this.title,
                        font: $font(this.largeTitleFontFamily, this.navigationBarTitleFontSize),
                        align: $align.center,
                        bgcolor: $color("clear"),
                        textColor: UIKit.textColor
                    },
                    layout: (make, view) => {
                        make.left.right.inset(0)
                        make.height.equalTo(20)
                        make.centerY.equalTo(view.super.safeArea)
                    }
                }
            ].concat(rightButtonView, leftButtonView)
        }
    }
}

class NavigationBarController extends Controller {
    static largeTitleViewSmallMode = 0
    static largeTitleViewLargeMode = 1

    /**
     * @type {NavigationBar}
     */
    navigationBar

    updateSelector() {
        this.selector = {
            navigation: $(this.navigationBar.id + "-navigation"),
            largeTitleView: $(this.navigationBar.id + "-large-title"),
            smallTitleView: $(this.navigationBar.id + "-small-title"),
            underlineView: this.navigationBar.navigationBarItems.isPinTitleView
                ? $(this.navigationBar.id + "-title-view-underline")
                : $(this.navigationBar.id + "-underline"),
            largeTitleMaskView: $(this.navigationBar.id + "-large-title-mask"),
            backgroundView: $(this.navigationBar.id + "-background"),
            titleViewBackgroundView: $(this.navigationBar.id + "-title-view-background")
        }
    }

    toNormal(permanent = true) {
        this.updateSelector()
        this.selector.backgroundView.hidden = false
        $ui.animate({
            duration: 0.2,
            animation: () => {
                this.selector.underlineView.alpha = 1
                // 隐藏大标题，显示小标题
                this.selector.smallTitleView.alpha = 1
                this.selector.largeTitleView.alpha = 0
            }
        })
        if (permanent && this.navigationBar.navigationBarItems) {
            this.navigationBar.largeTitleDisplayMode = NavigationBar.largeTitleDisplayModeNever
        }
    }

    toLargeTitle(permanent = true) {
        this.updateSelector()
        this.selector.backgroundView.hidden = true
        $ui.animate({
            duration: 0.2,
            animation: () => {
                this.selector.underlineView.alpha = 0
                this.selector.smallTitleView.alpha = 0
                this.selector.largeTitleView.alpha = 1
            }
        })
        if (permanent && this.navigationBar.navigationBarItems) {
            this.navigationBar.largeTitleDisplayMode = NavigationBar.largeTitleDisplayModeAlways
        }
    }

    #changeLargeTitleView(largeTitleViewMode) {
        const isSmallMode = largeTitleViewMode === NavigationBarController.largeTitleViewSmallMode
        $ui.animate({
            duration: 0.2,
            animation: () => {
                // 隐藏大标题，显示小标题
                this.selector.smallTitleView.alpha = isSmallMode ? 1 : 0
                this.selector.largeTitleView.alpha = isSmallMode ? 0 : 1
            }
        })
    }

    #largeTitleScrollAction(contentOffset) {
        const titleSizeMax = 40 // 下拉放大字体最大值

        // 标题跟随
        this.selector.largeTitleView.updateLayout((make, view) => {
            if (this.navigationBar.navigationBarNormalHeight - contentOffset > 0) {
                // 标题上移致隐藏后停止移动
                make.top
                    .equalTo(view.super.safeAreaTop)
                    .offset(this.navigationBar.navigationBarNormalHeight - contentOffset)
            } else {
                make.top.equalTo(view.super.safeAreaTop).offset(0)
            }
        })

        if (contentOffset > 0) {
            if (contentOffset >= this.navigationBar.navigationBarNormalHeight) {
                this.#changeLargeTitleView(NavigationBarController.largeTitleViewSmallMode)
            } else {
                this.#changeLargeTitleView(NavigationBarController.largeTitleViewLargeMode)
            }
        } else {
            // 切换模式
            this.#changeLargeTitleView(NavigationBarController.largeTitleViewLargeMode)
            // 下拉放大字体
            let size = this.navigationBar.largeTitleFontSize - contentOffset * 0.04
            if (size > titleSizeMax) size = titleSizeMax
            this.selector.largeTitleView.font = $font(this.navigationBar.largeTitleFontFamily, size)
        }
    }

    #navigationBarScrollAction(contentOffset) {
        const trigger =
            this.navigationBar.largeTitleDisplayMode === NavigationBar.largeTitleDisplayModeNever
                ? 5
                : this.navigationBar.navigationBarNormalHeight

        if (contentOffset > trigger) {
            this.selector.backgroundView.hidden = false
            $ui.animate({
                duration: 0.2,
                animation: () => {
                    if (this.navigationBar.navigationBarItems.isPinTitleView) {
                        this.selector.titleViewBackgroundView.alpha = 1
                    }
                    this.selector.largeTitleMaskView.alpha = 0
                    this.selector.underlineView.alpha = 1
                }
            })
        } else {
            this.selector.largeTitleMaskView.alpha = contentOffset > 0 ? 1 : 0
            this.selector.underlineView.alpha = 0
            this.selector.titleViewBackgroundView.alpha = 0
            this.selector.backgroundView.hidden = true
        }
    }

    didScroll(contentOffset) {
        if (!this.navigationBar.prefersLargeTitles) return

        const largeTitleDisplayMode = this.navigationBar.largeTitleDisplayMode
        if (largeTitleDisplayMode === NavigationBar.largeTitleDisplayModeAlways) return

        this.updateSelector()

        if (largeTitleDisplayMode === NavigationBar.largeTitleDisplayModeAutomatic) {
            if (!this.navigationBar.navigationBarItems?.isPinTitleView) {
                // titleView didScroll
                this.navigationBar.navigationBarItems?.titleView?.controller.didScroll(contentOffset)
                // 在 titleView 折叠前锁住主要视图
                if (contentOffset > 0) {
                    const height = this.navigationBar.navigationBarItems?.titleView?.height ?? 0
                    contentOffset -= height
                    if (contentOffset < 0) contentOffset = 0
                }
            }

            this.#largeTitleScrollAction(contentOffset)
            this.#navigationBarScrollAction(contentOffset)
        } else if (largeTitleDisplayMode === NavigationBar.largeTitleDisplayModeNever) {
            this.#navigationBarScrollAction(contentOffset)
        }
    }

    didEndDragging(contentOffset, decelerate, scrollToOffset, zeroOffset) {
        if (!this.navigationBar.prefersLargeTitles) return

        const largeTitleDisplayMode = this.navigationBar.largeTitleDisplayMode
        if (largeTitleDisplayMode === NavigationBar.largeTitleDisplayModeAlways) return

        this.updateSelector()

        if (largeTitleDisplayMode === NavigationBar.largeTitleDisplayModeAutomatic) {
            let titleViewHeight = 0
            if (!this.navigationBar.navigationBarItems?.isPinTitleView) {
                // titleView didEndDragging
                this.navigationBar.navigationBarItems?.titleView?.controller.didEndDragging(
                    contentOffset,
                    decelerate,
                    scrollToOffset,
                    zeroOffset
                )
                titleViewHeight = this.navigationBar.navigationBarItems?.titleView?.height ?? 0
                contentOffset -= titleViewHeight
            }
            if (contentOffset >= 0 && contentOffset <= this.navigationBar.largeTitleFontHeight) {
                scrollToOffset(
                    $point(
                        0,
                        contentOffset >= this.navigationBar.largeTitleFontHeight / 2
                            ? this.navigationBar.navigationBarNormalHeight + titleViewHeight - zeroOffset
                            : titleViewHeight - zeroOffset
                    )
                )
            }
        }
    }
}

module.exports = {
    NavigationBar,
    NavigationBarController
}
