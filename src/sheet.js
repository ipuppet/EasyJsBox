const { ValidationError } = require("./validation-error")
const { View } = require("./view")
const { UIKit } = require("./ui-kit")
const { NavigationView } = require("./navigation-view/navigation-view")
const { NavigationBar } = require("./navigation-view/navigation-bar")
const { BarButtonItem } = require("./navigation-view/navigation-bar-items")

class SheetAddNavBarError extends Error {
    constructor() {
        super("Please call setView(view) first.")
        this.name = "SheetAddNavBarError"
    }
}

class SheetViewTypeError extends ValidationError {
    constructor(parameter, type) {
        super(parameter, type)
        this.name = "SheetViewTypeError"
    }
}

class Sheet extends View {
    #present = () => {}
    #dismiss = () => {}
    style = Sheet.UIModalPresentationStyle.PageSheet
    #preventDismiss = false
    #navBar

    static UIModalPresentationStyle = {
        Automatic: -2,
        FullScreen: 0,
        PageSheet: 1,
        FormSheet: 2,
        CurrentContext: 3,
        Custom: 4,
        OverFullScreen: 5,
        OverCurrentContext: 6,
        Popover: 7,
        BlurOverFullScreen: 8
    }

    /**
     * @type {NavigationView}
     */
    navigationView

    init() {
        this.initNavBar()
        const { width, height } = $device.info.screen
        const UIView = $objc("UIView").invoke("initWithFrame", $rect(0, 0, width, height))
        const ViewController = $objc("UIViewController").invoke("alloc.init")
        const ViewControllerView = ViewController.$view()
        ViewControllerView.$setBackgroundColor(UIKit.primaryViewBackgroundColor)
        ViewControllerView.$addSubview(UIView)
        ViewController.$setModalPresentationStyle(this.style)
        ViewController.$setModalInPresentation(this.#preventDismiss)
        this.#present = () => {
            ViewControllerView.jsValue().add(this.navigationView?.getPage().definition ?? this.view)
            $ui.vc.ocValue().invoke("presentViewController:animated:completion:", ViewController, true, undefined)
        }
        this.#dismiss = () => ViewController.invoke("dismissViewControllerAnimated:completion:", true, undefined)
        return this
    }

    initNavBar() {
        if (!this.#navBar) {
            return
        }
        const { title = "", popButton = { title: $l10n("DONE") }, rightButtons = [] } = this.#navBar
        if (this.view === undefined) throw new SheetAddNavBarError()
        this.navigationView = new NavigationView()
        // 返回按钮
        const barButtonItem = new BarButtonItem()
        barButtonItem
            .setEvents(
                Object.assign(
                    {
                        tapped: () => {
                            this.dismiss()
                            if (typeof popButton.tapped === "function") popButton.tapped()
                        }
                    },
                    popButton.events
                )
            )
            .setAlign(UIKit.align.left)
            .setSymbol(popButton.symbol)
            .setTitle(popButton.title)
            .setColor(popButton.color)
            .setMenu(popButton.menu)
        const button = barButtonItem.definition.views[0]
        button.layout = (make, view) => {
            make.left.equalTo(view.super.safeArea).offset(15)
            make.centerY.equalTo(view.super.safeArea)
        }

        const navBar = this.navigationView.navigationBar
        navBar.setLargeTitleDisplayMode(NavigationBar.largeTitleDisplayModeNever)
        navBar.navigationBarLargeTitleHeight -= navBar.navigationBarNormalHeight
        navBar.navigationBarNormalHeight = NavigationBar.pageSheetNavigationBarHeight
        navBar.navigationBarLargeTitleHeight += navBar.navigationBarNormalHeight
        if (
            this.style === Sheet.UIModalPresentationStyle.FullScreen ||
            this.style === Sheet.UIModalPresentationStyle.OverFullScreen ||
            this.style === Sheet.UIModalPresentationStyle.BlurOverFullScreen
        ) {
            navBar.setTopSafeArea()
        } else {
            navBar.removeTopSafeArea()
        }

        this.navigationView.navigationBarItems.addPopButton("", button).setRightButtons(rightButtons)
        this.navigationView.setView(this.view).navigationBarTitle(title)
        if (this.view.props?.bgcolor) {
            this.navigationView?.getPage().setProp("bgcolor", this.view.props?.bgcolor)
        }
    }

    preventDismiss() {
        this.#preventDismiss = true
        return this
    }

    setStyle(style) {
        this.style = style
        return this
    }

    /**
     * 设置 view
     * @param {object} view 视图对象
     * @returns {this}
     */
    setView(view = {}) {
        if (typeof view !== "object") throw new SheetViewTypeError("view", "object")
        this.view = view
        return this
    }

    /**
     * 为 view 添加一个 navBar
     * @param {object} param
     *  {
     *      {string} title
     *      {object} popButton 参数与 BarButtonItem 一致
     *      {Array} rightButtons
     *  }
     * @returns {this}
     */
    addNavBar(navBarOptions) {
        this.#navBar = navBarOptions
        return this
    }

    /**
     * 弹出 Sheet
     */
    present() {
        this.#present()
    }

    /**
     * 关闭 Sheet
     */
    dismiss() {
        this.#dismiss()
    }
}

module.exports = {
    Sheet
}
