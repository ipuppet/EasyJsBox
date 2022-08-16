const { View, PageView } = require("./view")
const { Controller } = require("./controller")
const { UIKit } = require("./ui-kit")

class TabBarCellView extends View {
    constructor(args = {}) {
        super(args)
        this.setIcon(args.icon)
        this.setTitle(args.title)
        if (args.activeStatus !== undefined) {
            this.activeStatus = args.activeStatus
        }
    }

    setIcon(icon) {
        // 格式化单个icon和多个icon
        if (icon instanceof Array) {
            this.icon = icon
        } else {
            this.icon = [icon, icon]
        }
        return this
    }

    setTitle(title) {
        this.title = title
        return this
    }

    active() {
        $(`${this.props.id}-icon`).image = $image(this.icon[1])
        $(`${this.props.id}-icon`).tintColor = $color("systemLink")
        $(`${this.props.id}-title`).textColor = $color("systemLink")
        this.activeStatus = true
    }

    inactive() {
        $(`${this.props.id}-icon`).image = $image(this.icon[0])
        $(`${this.props.id}-icon`).tintColor = $color("lightGray")
        $(`${this.props.id}-title`).textColor = $color("lightGray")
        this.activeStatus = false
    }

    getView() {
        this.views = [
            {
                type: "image",
                props: {
                    id: `${this.props.id}-icon`,
                    image: $image(this.activeStatus ? this.icon[1] : this.icon[0]),
                    bgcolor: $color("clear"),
                    tintColor: $color(this.activeStatus ? "systemLink" : "lightGray")
                },
                layout: (make, view) => {
                    make.centerX.equalTo(view.super)
                    const half = TabBarController.tabBarHeight / 2
                    make.size.equalTo(half)
                    make.top.inset((TabBarController.tabBarHeight - half - 13) / 2)
                }
            },
            {
                type: "label",
                props: {
                    id: `${this.props.id}-title`,
                    text: this.title,
                    font: $font(10),
                    textColor: $color(this.activeStatus ? "systemLink" : "lightGray")
                },
                layout: (make, view) => {
                    make.centerX.equalTo(view.prev)
                    make.top.equalTo(view.prev.bottom).offset(3)
                }
            }
        ]
        return this
    }
}

class TabBarHeaderView extends View {
    height = 60

    getView() {
        this.type = "view"
        this.setProp("bgcolor", this.props.bgcolor ?? UIKit.primaryViewBackgroundColor)
        this.layout = (make, view) => {
            make.left.right.bottom.equalTo(view.super)
            make.top.equalTo(view.super.safeAreaBottom).offset(-this.height - TabBarController.tabBarHeight)
        }

        this.views = [
            View.create({
                props: this.props,
                views: this.views,
                layout: (make, view) => {
                    make.left.right.top.equalTo(view.super)
                    make.height.equalTo(this.height)
                }
            })
        ]

        return this
    }
}

/**
 * @property {function(from: string, to: string)} TabBarController.events.onChange
 */
class TabBarController extends Controller {
    static tabBarHeight = 50

    #pages = {}
    #cells = {}
    #header
    #selected

    get selected() {
        return this.#selected
    }

    set selected(selected) {
        this.switchPageTo(selected)
    }

    get contentOffset() {
        return TabBarController.tabBarHeight + (this.#header?.height ?? 0)
    }

    /**
     *
     * @param {Object} pages
     * @returns {this}
     */
    setPages(pages = {}) {
        Object.keys(pages).forEach(key => this.setPage(key, pages[key]))
        return this
    }

    setPage(key, page) {
        if (this.#selected === undefined) this.#selected = key
        if (page instanceof PageView) {
            this.#pages[key] = page
        } else {
            this.#pages[key] = PageView.createByViews(page)
        }
        if (this.#selected !== key) this.#pages[key].activeStatus = false
        return this
    }

    switchPageTo(key) {
        if (this.#pages[key]) {
            if (this.#selected === key) return
            // menu 动画
            $ui.animate({
                duration: 0.4,
                animation: () => {
                    // 点击的图标
                    this.#cells[key].active()
                }
            })
            // 之前的图标
            this.#cells[this.#selected].inactive()
            // 切换页面
            this.#pages[this.#selected].hide()
            this.#pages[key].show()
            this.callEvent("onChange", this.#selected, key)
            this.#selected = key
        }
    }

    /**
     *
     * @param {Object} cells
     * @returns {this}
     */
    setCells(cells = {}) {
        Object.keys(cells).forEach(key => this.setCell(key, cells[key]))
        return this
    }

    setCell(key, cell) {
        if (this.#selected === undefined) this.#selected = key
        if (!(cell instanceof TabBarCellView)) {
            cell = new TabBarCellView({
                props: { info: { key } },
                icon: cell.icon,
                title: cell.title,
                activeStatus: this.#selected === key
            })
        }
        this.#cells[key] = cell
        return this
    }

    setHeader(view) {
        this.#header = view
        return this
    }

    #cellViews() {
        const views = []
        Object.values(this.#cells).forEach(cell => {
            cell.setEvent("tapped", sender => {
                const key = sender.info.key
                // 切换页面
                this.switchPageTo(key)
            })
            views.push(cell.getView())
        })
        return views
    }

    #pageViews() {
        return Object.values(this.#pages).map(page => {
            const view = page.definition
            if (UIKit.scrollViewList.indexOf(view.views[0].type) > -1) {
                if (view.views[0].props === undefined) {
                    view.views[0].props = {}
                }
                // indicatorInsets
                if (view.views[0].props.indicatorInsets) {
                    const old = view.views[0].props.indicatorInsets
                    view.views[0].props.indicatorInsets = $insets(
                        old.top,
                        old.left,
                        old.bottom + this.contentOffset,
                        old.right
                    )
                } else {
                    view.views[0].props.indicatorInsets = $insets(0, 0, 0, this.contentOffset)
                }
                // footer
                if (view.views[0].footer === undefined) {
                    view.views[0].footer = { props: {} }
                } else if (view.views[0].footer.props === undefined) {
                    view.views[0].footer.props = {}
                }
                if (view.views[0].props.footer.props.height) {
                    view.views[0].props.footer.props.height += this.contentOffset
                } else {
                    view.views[0].props.footer.props.height = this.contentOffset
                }
            }
            return view
        })
    }

    generateView() {
        const tabBarView = {
            type: "view",
            layout: (make, view) => {
                make.centerX.equalTo(view.super)
                make.width.equalTo(view.super)
                make.top.equalTo(view.super.safeAreaBottom).offset(-TabBarController.tabBarHeight)
                make.bottom.equalTo(view.super)
            },
            views: [
                UIKit.blurBox({}, [
                    {
                        type: "stack",
                        layout: $layout.fillSafeArea,
                        props: {
                            axis: $stackViewAxis.horizontal,
                            distribution: $stackViewDistribution.fillEqually,
                            spacing: 0,
                            stack: {
                                views: this.#cellViews()
                            }
                        }
                    }
                ]),
                UIKit.separatorLine({}, UIKit.align.top)
            ]
        }
        return View.createByViews(this.#pageViews().concat(this.#header?.definition ?? [], tabBarView))
    }
}

module.exports = {
    TabBarCellView,
    TabBarHeaderView,
    TabBarController
}
