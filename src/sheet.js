const { ValidationError } = require("./validation-error")
const { NavigationView } = require("./navigation-view/navigation-view")
const { NavigationBar } = require("./navigation-view/navigation-bar")
const { UIKit } = require("./ui-kit")

class SheetViewUndefinedError extends Error {
    constructor() {
        super("Please call setView(view) first.")
        this.name = "SheetViewUndefinedError"
    }
}

class SheetViewTypeError extends ValidationError {
    constructor(parameter, type) {
        super(parameter, type)
        this.name = "SheetViewTypeError"
    }
}

class Sheet {
    #present = () => {}
    #dismiss = () => {}
    style = Sheet.UIModalPresentationStyle.PageSheet
    #preventDismiss = false
    #navBar
    #willDismiss
    #didDismiss

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
        $define({
            type: "SheetViewController: UIViewController",
            events: {
                "viewWillDisappear:": animated => {
                    if (typeof this.#willDismiss === "function") {
                        this.#willDismiss(animated)
                    }
                },
                "viewDidDisappear:": animated => {
                    if (typeof this.#didDismiss === "function") {
                        this.#didDismiss(animated)
                    }
                }
            }
        })
        this.sheetVC = $objc("SheetViewController").$new()

        const view = this.sheetVC.$view()
        view.$addSubview($ui.create({ type: "view" }))
        this.sheetVC.$setModalPresentationStyle(this.style)
        this.sheetVC.$setModalInPresentation(this.#preventDismiss)
        this.#present = () => {
            view.jsValue().add(this.navigationView?.getPage().definition ?? this.view)
            $ui.vc.ocValue().invoke("presentViewController:animated:completion:", this.sheetVC, true, null)
        }
        this.#dismiss = () => this.sheetVC.invoke("dismissViewControllerAnimated:completion:", true, null)
        return this
    }

    initNavBar() {
        if (!this.#navBar) {
            return
        }
        const { title = "", popButton = { title: $l10n("CLOSE") }, rightButtons = [] } = this.#navBar
        if (this.view === undefined) throw new SheetViewUndefinedError()

        this.navigationView = new NavigationView()
        const navBar = this.navigationView.navigationBar
        navBar.setLargeTitleDisplayMode(NavigationBar.largeTitleDisplayModeNever)
        navBar.navigationBarLargeTitleHeight -= navBar.navigationBarNormalHeight
        navBar.navigationBarNormalHeight = UIKit.PageSheetNavigationBarNormalHeight
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

        // 返回按钮
        popButton.events = Object.assign(
            {
                tapped: async () => {
                    if (typeof popButton.tapped === "function") {
                        await popButton.tapped()
                    }
                    this.dismiss()
                }
            },
            popButton.events ?? {}
        )
        this.navigationView.navigationBarItems.addLeftButton(popButton).setRightButtons(rightButtons)
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

    willDismiss(willDismiss) {
        this.#willDismiss = willDismiss
        return this
    }
    didDismiss(didDismiss) {
        this.#didDismiss = didDismiss
        return this
    }

    static quickLookImage(data, title = $l10n("PREVIEW")) {
        const sheet = new Sheet()
        sheet
            .setView({
                type: "view",
                views: [
                    {
                        type: "scroll",
                        props: {
                            zoomEnabled: true,
                            maxZoomScale: 3
                        },
                        layout: $layout.fill,
                        views: [
                            {
                                type: "image",
                                props: { data: data },
                                layout: $layout.fill
                            }
                        ]
                    }
                ],
                layout: $layout.fill
            })
            .addNavBar({
                title,
                rightButtons: [
                    {
                        symbol: "square.and.arrow.up",
                        tapped: () => $share.sheet(data)
                    }
                ]
            })
            .init()
            .present()
    }
}

module.exports = {
    Sheet
}
