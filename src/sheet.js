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

    /**
     * @type {NavigationView}
     */
    navigationView

    init() {
        const UIModalPresentationStyle = { pageSheet: 1 } // TODO: sheet style
        const { width, height } = $device.info.screen
        const UIView = $objc("UIView").invoke("initWithFrame", $rect(0, 0, width, height))
        const PSViewController = $objc("UIViewController").invoke("alloc.init")
        const PSViewControllerView = PSViewController.$view()
        PSViewControllerView.$setBackgroundColor($color("primarySurface"))
        PSViewControllerView.$addSubview(UIView)
        PSViewController.$setModalPresentationStyle(UIModalPresentationStyle.pageSheet)
        this.#present = () => {
            PSViewControllerView.jsValue().add(this.navigationView?.getPage().definition ?? this.view)
            $ui.vc.ocValue().invoke("presentModalViewController:animated", PSViewController, true)
        }
        this.#dismiss = () => PSViewController.invoke("dismissModalViewControllerAnimated", true)
        return this
    }

    /**
     * 设置 view
     * @param {Object} view 视图对象
     * @returns {this}
     */
    setView(view = {}) {
        if (typeof view !== "object") throw new SheetViewTypeError("view", "object")
        this.view = view
        return this
    }

    /**
     * 为 view 添加一个 navBar
     * @param {Object} param
     *  {
     *      {string} title
     *      {Object} popButton 参数与 BarButtonItem 一致
     *      {Array} rightButtons
     *  }
     * @returns {this}
     */
    addNavBar({ title, popButton = { title: "Done" }, rightButtons = [] }) {
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
            .setMenu(popButton.menu)
        const button = barButtonItem.definition.views[0]
        button.layout = (make, view) => {
            make.left.equalTo(view.super.safeArea).offset(15)
            make.centerY.equalTo(view.super.safeArea)
        }
        this.navigationView.navigationBar
            .setLargeTitleDisplayMode(NavigationBar.largeTitleDisplayModeNever)
            .pageSheetMode()
        this.navigationView.navigationBarItems.addPopButton("", button).setRightButtons(rightButtons)
        this.navigationView.setView(this.view).navigationBarTitle(title)
        if (this.view.props?.bgcolor) {
            this.navigationView?.getPage().setProp("bgcolor", this.view.props?.bgcolor)
        }
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
