const VERSION = "1.0.0"
const ROOT_PATH = "/EasyJsBox" // JSBox path, not nodejs
const SHARED_PATH = "shared://EasyJsBox"

function l10n(language, content) {
    if (typeof content === "string") {
        const strings = {}
        const strArr = content.split(";")
        strArr.forEach(line => {
            line = line.trim()
            if (line !== "") {
                const kv = line.split("=")
                strings[kv[0].trim().slice(1, -1)] = kv[1].trim().slice(1, -1)
            }
        })
        content = strings
    }
    const strings = $app.strings
    strings[language] = Object.assign(content, $app.strings[language])
    $app.strings = strings
}

function uuid() {
    const s = []
    const hexDigits = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
    for (let i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1)
    }
    s[14] = "4" // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1) // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-"
    return s.join("")
}

function getVelueWithoutUndefined(arg, _default = null) {
    if (arg === undefined)
        return _default
    return arg
}

class Controller {
    constructor() {
        this.events = {}
    }

    setEvents(events) {
        Object.keys(events).forEach(event => this.setEvent(event, events[event]))
        return this
    }

    setEvent(event, callback) {
        this.events[event] = callback
        return this
    }

    callEvent(event, ...args) {
        if (typeof this.events[event] === "function") {
            this.events[event](...args)
        }
    }
}

class View {
    constructor() {
        // 通用样式
        this.blurStyle = $blurStyle.thinMaterial
        this.textColor = $color("primaryText", "secondaryText")
        this.linkColor = $color("systemLink")
        this.statusBarStyle = 0
        // Other
        this.align = { left: 0, right: 1 }
    }

    uuid() {
        return uuid()
    }

    /**
     * 获取Window大小
     * @returns 
     */
    getWindowSize() {
        return $objc("UIWindow").$keyWindow().jsValue().size
    }

    /**
     * 是否属于大屏设备
     */
    isLargeScreen() {
        return $device.isIpad || $device.isIpadPro
    }

    /**
     * 判断是否是分屏模式
     * @returns {Boolean}
     */
    isSplitScreenMode() {
        return $device.info.screen.width !== this.getWindowSize().width
    }

    underline(props = {}) {
        return { // canvas
            type: "canvas",
            props: props,
            layout: (make, view) => {
                if (view.prev === undefined) return false
                make.top.equalTo(view.prev.bottom)
                make.height.equalTo(1 / $device.info.screen.scale)
                make.left.right.inset(0)
            },
            events: {
                draw: (view, ctx) => {
                    ctx.strokeColor = $color("separatorColor")
                    ctx.setLineWidth(1)
                    ctx.moveToPoint(0, 0)
                    ctx.addLineToPoint(view.frame.width, 0)
                    ctx.strokePath()
                }
            }
        }
    }

    blurBox(props = {}) {
        return {
            type: "blur",
            props: Object.assign({
                style: this.blurStyle
            }, props),
            layout: $layout.fill
        }
    }
}

class ContainerView extends View {
    constructor(args = {}) {
        super()
        this.props = args.props ?? {}
        this.props.id = args?.props?.id ?? this.uuid()
        this.views = args.views ?? []
        this.events = args.events ?? {}
        this.layout = args.layout ?? $layout.fill
    }

    static createByViews(views) {
        return new ContainerView({ views })
    }

    static createByContainers(containers) {
        const views = containers.map(container => container.getView())
        return ContainerView.createByViews(views)
    }

    setProps(props) {
        this.props = props
        return this
    }

    setViews(views) {
        this.views = views
        return this
    }

    setEvents(events) {
        this.evevts = events
        return this
    }

    setLayout(layout) {
        this.layout = layout
        return this
    }

    getView() {
        return {
            type: "view",
            props: this.props,
            views: this.views,
            events: this.events,
            layout: this.layout
        }
    }
}

class NavigationController extends Controller {
    constructor() {
        super()
        this.navigationViews = []
    }

    setRootNavigationView(navigationView) {
        this.navigationViews = []
        this.navigationViews.push(navigationView)
        return this
    }

    onPop(navigationView) {
        this.callEvent("onPop", navigationView) // 被弹出的 NavigationView 对象
    }

    /**
     * 重新设计$ui.push()
     * @param {Object} args 参数
     * {
            views: [],
            statusBarStyle: statusBarStyle,
            title: "",
            parent: "",
            navButtons: [],
            topOffset: true, // 这样会导致nav的磨砂效果消失，因为视图不会被nav遮挡
            bgcolor = "primarySurface",
            disappeared: () => { },
        }
     */
    push(navigationView) {
        const parent = this.navigationViews[this.navigationViews.length - 1]
        navigationView.navigationBar.addPopButton(parent?.navigationBar.title ?? $l10n("BACK"))
        this.navigationViews.push(navigationView)
        $ui.push({
            props: {
                statusBarStyle: this.statusBarStyle,
                navBarHidden: true
            },
            events: {
                disappeared: () => {
                    this.onPop(navigationView)
                }
            },
            views: [navigationView.getView()]
        })
    }
}

class NavigationBar extends View {
    constructor(args = {}) {
        super()
        this.id = args.id ?? this.uuid()
        this.title = args.title
        this.backgroundColor = args.backgroundColor
        this.largeTitleHeight = args.largeTitleHeight ?? 90
        this.rightButtons = args.rightButtons ?? []
        this.leftButtons = args.leftButtons ?? []
        this.hasbutton = args.rightButtons?.length || args.leftButtons?.length
        this.prefersLargeTitles = getVelueWithoutUndefined(args.prefersLargeTitles, true)
    }

    setId(id) {
        this.id = id
    }

    setTitle(title) {
        this.title = title
    }

    setBackgroundColor(backgroundColor) {
        this.backgroundColor = backgroundColor
    }

    setLargeTitleHeight(height) {
        this.largeTitleHeight = height
    }

    setRightButtons(rightButtons) {
        this.rightButtons = rightButtons
        if (!this.hasbutton) this.hasbutton = true
    }

    setLeftButtons(leftButtons) {
        this.leftButtons = leftButtons
        if (!this.hasbutton) this.hasbutton = true
    }

    addRightButton(id, symbol, tapped) {
        this.rightButtons.push(this.navigationBarButton(id, symbol, tapped, this.align.right))
        if (!this.hasbutton) this.hasbutton = true
    }

    addLeftButton(id, symbol, tapped) {
        this.leftButtons.push(this.navigationBarButton(id, symbol, tapped, this.align.left))
        if (!this.hasbutton) this.hasbutton = true
    }

    addPopButton(parent) {
        this.popButtonView = { // 返回按钮
            type: "button",
            props: {
                bgcolor: $color("clear"),
                symbol: "chevron.left",
                tintColor: this.linkColor,
                title: ` ${parent}`,
                titleColor: this.linkColor,
                font: $font("bold", 16)
            },
            layout: (make, view) => {
                make.left.inset(10)
                make.centerY.equalTo(view.super)
            },
            events: { tapped: () => { $ui.pop() } }
        }
    }

    removePopButton() {
        this.popButtonView = undefined
    }

    /**
     * 用于创建一个靠右侧按钮（自动布局）
     * @param {String} id 不可重复
     * @param {String} symbol symbol图标（目前只用symbol）
     * @callback tapped 按钮点击事件，会传入三个函数，start()、done()和cancel()
     *     调用 start() 表明按钮被点击，准备开始动画
     *     调用 done() 表明您的操作已经全部完成，默认操作成功完成，播放一个按钮变成对号的动画
     *                 若第一个参数传出false则表示运行出错
     *                 第二个参数为错误原因($ui.toast(message))
     *      调用 cancel() 表示取消操作
     *     示例：
     *      (start, done, cancel) => {
     *          start()
     *          const upload = (data) => { return false }
     *          if (upload(data)) { done() }
     *          else { done(false, "Upload Error!") }
     *      }
     * @param {String} align 对齐方式 View.align.right View.align.left
     */
    navigationBarButton(id, symbol, tapped, align = this.align.right) {
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
                        tintColor: this.textColor,
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
                    if (align === this.align.right) make.right.equalTo(view.prev.left)
                    else make.left.equalTo(view.prev.right)
                } else {
                    if (align === this.align.right) make.right.inset(0)
                    else make.left.inset(0)
                }
            }
        }
    }

    /**
     * 页面大标题
     */
    getLargeTitleView() {
        return {
            type: "view",
            props: { height: this.largeTitleHeight },
            views: [{
                type: "label",
                props: {
                    id: this.id + "-large-title",
                    text: this.title,
                    textColor: this.textColor,
                    align: $align.left,
                    font: $font("bold", 35),
                    line: 1
                },
                layout: (make, view) => {
                    make.left.equalTo(view.super.safeArea).offset(20)
                    make.top.equalTo(view.super.safeArea).offset(50)
                }
            }],
            layout: (make, view) => {
                make.width.equalTo(view.super)
                make.height.equalTo(this.largeTitleHeight)
            }
        }
    }

    getNavigationBarView() {
        const getButtonView = (buttons, align) => {
            return buttons.length > 0 ? {
                type: "view",
                views: [{
                    type: "view",
                    views: buttons,
                    layout: $layout.fill
                }],
                layout: (make, view) => {
                    make.top.equalTo(view.super.safeAreaTop)
                    make.bottom.equalTo(view.super.safeAreaTop).offset(50)
                    if (align === this.align.left) make.left.inset(10)
                    else make.right.inset(10)
                    make.width.equalTo(buttons.length * 60) // 单个按钮宽度60
                }
            } : {}
        }
        const rightButtonView = getButtonView(this.rightButtons, this.align.right)
        const leftButtonView = this.popButtonView ?? getButtonView(this.leftButtons, this.align.left)
        return { // 顶部bar
            type: "view",
            props: {
                id: this.id + "-navigation",
                bgcolor: $color("clear")
            },
            layout: (make, view) => {
                make.left.top.right.inset(0)
                make.bottom.equalTo(view.super.safeAreaTop).offset(45)
            },
            views: [
                this.backgroundColor ? {
                    type: "view",
                    props: {
                        hidden: true,
                        bgcolor: this.backgroundColor,
                        id: this.id + "-background"
                    },
                    layout: $layout.fill
                } : this.blurBox({
                        hidden: true,
                        id: this.id + "-background"
                    }),
                this.underline({
                    id: this.id + "-underline",
                    alpha: 0
                }),
                { // 标题
                    type: "label",
                    props: {
                        id: this.id + "-small-title",
                        alpha: this.prefersLargeTitles ? 0 : 1,  // 不显示大标题则默认显示小标题
                        text: this.title,
                        font: $font("bold", 17),
                        align: $align.center,
                        bgcolor: $color("clear"),
                        textColor: this.textColor
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

    scrollAction(view) {
        // 样式
        const titleSizeMax = 40, // 下拉放大字体最大值
            topOffset = -10,
        // views
            id = this.id,
            largeTitleView = $(id + "-large-title"),
            smallTitleView = $(id + "-small-title"),
            underlineView = $(id+ "-underline"),
            backgroundView = $(id + "-background")
        // 顶部信息栏
        if (view.contentOffset.y > 5) {
            $ui.animate({
                duration: 0.2,
                animation: () => {
                    underlineView.alpha = 1
                    backgroundView.hidden = false
                }
            })
            if (view.contentOffset.y > 40) {
                $ui.animate({
                    duration: 0.2,
                    animation: () => {
                        smallTitleView.alpha = 1
                        largeTitleView.alpha = 0
                    }
                })
            } else {
                $ui.animate({
                    duration: 0.2,
                    animation: () => {
                        smallTitleView.alpha = 0
                        largeTitleView.alpha = 1
                    }
                })
            }
        } else {
            // 下拉放大字体
            if (view.contentOffset.y <= topOffset) {
                let size = 35 - view.contentOffset.y * 0.04
                if (size > titleSizeMax) size = titleSizeMax
                largeTitleView.font = $font("bold", size)
            }
            // 隐藏下划线和模糊
            $ui.animate({
                duration: 0.2,
                animation: () => {
                    underlineView.alpha = 0
                    backgroundView.hidden = true
                }
            })
        }
    }
}

class NavigationView extends View {
    constructor() {
        super()
        this.navigationBar = new NavigationBar()
    }

    setNavigationBar(navigationBar) {
        this.navigationBar = navigationBar
        return this
    }

    setView(view) {
        if (view.props === undefined) view.props = {}
        if (view.events === undefined) view.events = {}
        this.view = view
    }

    getView() {
        if (typeof this.view !== "object") throw "The type of the parameter `view` must be object."
        const scrollViews = [
            "scroll",
            "list",
            "matrix"
        ]
        let views = []
        if (scrollViews.indexOf(this.view.type) > -1) {
            if (this.navigationBar.prefersLargeTitles) {
                this.view.props.header = this.navigationBar.getLargeTitleView()
                this.view.events.didScroll = sender => this.navigationBar.scrollAction(sender)
            }
            views = [
                this.view,
                this.navigationBar.getNavigationBarView()
            ]
        } else {
            views = this.navigationBar.prefersLargeTitles ? [
                this.navigationBar.getLargeTitleView(),
                {
                    type: "scroll",
                    props: {
                        alwaysBounceHorizontal: false,
                        alwaysBounceVertical: true
                    },
                    views: [this.view],
                    layout: (make, view) => {
                        make.left.right.bottom.equalTo(view.super)
                        view.layout(make,view)
                        make.top.equalTo(view.super).offset(this.navigationBar.largeTitleHeight + 15)
                    },
                    events: {
                        didScroll: sender => this.navigationBar.scrollAction(sender)
                    }
                },
                this.navigationBar.getNavigationBarView()
            ] : [
                this.view,
                this.navigationBar.getNavigationBarView()
            ]
        }
        return ContainerView.createByViews(views)
    }
}

class Sheet extends View {
    constructor() {
        super()
        const UIModalPresentationStyle = { pageSheet: 1 } // TODO: sheet style
        const { width, height } = $device.info.screen
        const UIView = $objc("UIView").invoke("initWithFrame", $rect(0, 0, width, height))
        const PSViewController = $objc("UIViewController").invoke("alloc.init")
        const PSViewControllerView = PSViewController.$view()
        PSViewControllerView.$setBackgroundColor($color("primarySurface"))
        PSViewControllerView.$addSubview(UIView)
        PSViewController.$setModalPresentationStyle(UIModalPresentationStyle.pageSheet)
        this._present = () => {
            PSViewControllerView.jsValue().add(this.view)
            $ui.vc.ocValue().invoke("presentModalViewController:animated", PSViewController, true)
        }
        this._dismiss = () => PSViewController.invoke("dismissModalViewControllerAnimated", true)
    }

    /**
     * 设置 view
     * @param {Object} view 视图对象
     * @returns this
     */
    setView(view = {}) {
        if (typeof view !== "object") throw "The type of the parameter `view` must be object."
        this.view = view
        return this
    }

    /**
     * 为 view 添加一个 navBar
     * @param {String} title 标题
     * @callback callback 按钮回调函数，若未定义则调用 this.dismiss()
     * @param {String} btnText 按钮显示的文字，默认为 "Done"
     * @returns this
     */
    addNavBar(title, callback, btnText = "Done") {
        if (this.view === undefined) throw "Please call setView(view) first."
        this.view = {
            type: "view",
            layout: $layout.fill,
            views: [
                this.view,
                { // nav
                    type: "view",
                    layout: (make, view) => {
                        make.height.equalTo(50)
                        make.top.width.equalTo(view.super)
                    },
                    views: [
                        this.blurBox(),
                        this.underline(),
                        { // view
                            type: "view",
                            layout: (make, view) => {
                                make.size.left.top.equalTo(view.super.safeArea)
                            },
                            views: [
                                { // 完成按钮
                                    type: "button",
                                    layout: (make, view) => {
                                        make.centerY.height.equalTo(view.super)
                                        make.left.inset(15)
                                    },
                                    props: {
                                        title: btnText,
                                        bgcolor: $color("clear"),
                                        font: $font(16),
                                        titleColor: $color("systemLink")
                                    },
                                    events: {
                                        tapped: () => {
                                            if (typeof callback === "function") callback()
                                            else this.dismiss()
                                        }
                                    }
                                },
                                {
                                    type: "label",
                                    props: {
                                        text: title,
                                        font: $font("bold", 17)
                                    },
                                    layout: (make, view) => {
                                        make.center.equalTo(view.super)
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        }
        return this
    }

    /**
     * 弹出 Sheet
     */
    present() {
        this._present()
    }

    /**
     * 关闭 Sheet
     */
    dismiss() {
        this._dismiss()
    }
}

class PageController extends Controller{
    constructor() {
        super()
        this.selectedPage = null
        this.pages = {}
    }

    setPages(pages) {
        Object.keys(pages).forEach(key => this.setPage(key, pages[key]))
    }

    setPage(key, item) {
        const visibility = this.selectedPage === key
        if (item instanceof ContainerView) {
            item.setVisibility(visibility)
            this.pages[key] = item
        } else {
            const page = new PageView()
            page.setViews(item).setVisibility(visibility)
            this.pages[key] = page
        }
    }

    showPage(key) {
        if (this.pages[key]){
            if (this.selectedPage !== null)
                $(this.pages[this.selectedPage].id).hidden = true
            $(this.pages[key].id).hidden = false
            this.callEvent("onChange", this.selectedPage, key)
            this.selectedPage = key
        }
    }

    getView() {
        return ContainerView.createByContainers(Object.values(this.pages))
    }
}

class PageView extends ContainerView {
    constructor(args = {}) {
        this.pageIdPrefix = "page-"
        args.props ?? (args.props = {})
        args.props.id = `${this.pageIdPrefix}${key}`
        super(args)
    }

    setVisibility(visibility) {
        this.visibility = visibility
        return this
    }

    setHorizontalSafeArea(bool) {
        this.horizontalSafeArea = bool
        return this
    }

    _layout(make, view) {
        make.top.bottom.equalTo(view.super)
        if (this.horizontalSafeArea) {
            make.left.right.equalTo(view.super.safeArea)
        } else {
            make.left.right.equalTo(view.super)
        }
    }

    getView() {
        this.layout = this._layout
        this.props.hidden = !this.visibility
        this.props.clipsToBounds = true
        return super.getView()
    }
}

// TODO: menu TabBar

class UIKit extends View {
    constructor() {
        super()
        // 隐藏 jsbox 默认 nav 栏
        this.jsboxNavHidden = true
    }

    useJsboxNav() {
        this.jsboxNavHidden = false
    }

    setTitle(title) {
        $ui.title = title
        this.title = title
    }

    setNavButtons(buttons) {
        this.navButtons = buttons
    }
}

class Kernel {
    constructor() {
        this.startTime = Date.now()
        this.path = {
            root: ROOT_PATH,
            components: `${ROOT_PATH}/src/Components`,
            plugins: `${ROOT_PATH}/src/Plugins`,
            shared: {
                root: SHARED_PATH,
                components: `${SHARED_PATH}/src/Components`,
                plugins: `${SHARED_PATH}/src/Plugins`
            }
        }
        this.version = VERSION
        this.components = {}
        this.plugins = {}
        this.name = $addin.current.name
        this.UIKit = new UIKit()
    }

    uuid() {
        return uuid()
    }

    l10n(language, content) {
        l10n(language, content)
    }

    debug(print) {
        this.debugMode = true
        if (typeof print === "function") {
            this.debugPrint = print
        }
        this.print("You are running EasyJsBox in debug mode.")
    }

    print(message) {
        if (!this.debugMode) return
        if (typeof this.debugPrint === "function") {
            this.debugPrint(message)
        } else {
            console.log(message)
        }
    }

    /**
     * 注册组件
     * @param {String} component 组件名
     * @param {Object} args 传递给controller的参数
     *                      可设置不同 name 用来注册多个相同组件，防止冲突。{name: "MyComponent"}
     */
    registerComponent(component, args = {}) {
        component = component.toLowerCase()
        if (typeof args !== "object") {
            args = { name: args }
        } else if (!args.name) {
            args.name = component
        }
        if (this.hasComponent(args.name))
            return this.getComponent(args.name)
        args._name = component // 组件名称
        const componentPath = `${this.path.components}/${component}.js`
        const { Controller, View } = require(componentPath)
        // 通过 DataCenter, view 可在构造函数中获取 controller 定义的属性
        const dataCenter = new DataCenter()
        // 新实例
        const controller = new Controller({ kernel: this, args, dataCenter })
        const view = new View({ UIKit: this.UIKit, dataCenter })
        // 关联 view 和 controller
        controller.view = view
        view.controller = controller
        // 注册到 kernel
        this.components[args.name] = {
            controller: controller,
            view: view,
            dataCenter: dataCenter
        }
        return this.components[args.name]
    }

    /**
     * 批量注册组件
     * @param {Array} components 包含组件名的数组
     */
    registerComponents(components) {
        for (let component of components) {
            this.registerComponent(component)
        }
    }

    /**
     * 通过组件名获取已注册的组件
     * @param {String} component 组件名
     */
    getComponent(component) {
        component = component.toLowerCase()
        return this.components[component]
    }

    hasComponent(component) {
        component = component.toLowerCase()
        return this.components[component] !== undefined
    }

    /**
     * 注册插件
     * @param {String} plugin 
     */
    registerPlugin(plugin) {
        const pluginPath = `${this.path.plugins}/${plugin}.js`
        const { Plugin } = require(pluginPath)
        this.plugins[plugin] = {
            plugin: Plugin
        }
        return this.plugins[plugin].plugin
    }

    /**
     * 批量注册插件
     * @param {Array} plugins 
     */
    registerPlugins(plugins) {
        for (let plugin of plugins) {
            this.registerPlugin(plugin)
        }
    }

    /**
     * 获取插件
     * @param {String} plugin 
     */
    getPlugin(plugin) {
        return this.plugins[plugin]
    }

    UIRender(views, props, events) {
        $ui.render({
            type: "view",
            props: Object.assign({
                title: this.UIKit.title ?? this.name,
                navButtons: this.UIKit.navButtons ?? []
            }, props),
            layout: $layout.fill,
            views: views,
            events: events
        })
    }

    /**
     * 渲染页面
     * @return {CallableFunction} 返回值为匿名函数，调用该函数开始渲染页面
     */
    render(pages, menus) {
        this.registerComponents([
            "loading",
            "menu",
            "page"
        ])
        // 注入menu控制器
        this.components.menu.controller.setCallback((from, to) => {
            $(`${this.components.page.dataCenter.get("pageIdPrefix")}${from}`).hidden = true
            $(`${this.components.page.dataCenter.get("pageIdPrefix")}${to}`).hidden = false
        })
        // 首页加载动画
        this.components.loading.controller.start()
        // 注入页面和菜单
        this.components.page.controller.setPages(pages)
        this.components.menu.controller.setMenus(menus)
        return () => {
            this.UIRender(
                [
                    this.components.page.view.getView(),
                    this.components.menu.view.getView()
                ],
                {
                    navBarHidden: true,
                    titleColor: $color("primaryText"),
                    barColor: $color("primarySurface"),
                    statusBarStyle: 0
                },
                {
                    ready: () => {
                        this.components.loading.controller.end()
                    },
                    layoutSubviews: () => {
                        if (!this.orientation) {
                            this.orientation = $device.info.screen.orientation
                            return
                        }
                        if (this.orientation !== $device.info.screen.orientation) {
                            this.orientation = $device.info.screen.orientation
                            const menuView = this.components.menu.view
                            const menuDataCenter = this.components.menu.dataCenter
                            // 更新菜单元素的布局
                            for (let i = 0; i < menuDataCenter.get("menus").length; i++) {
                                $(`${menuDataCenter.get("itemIdPrefix")}${i}`).remakeLayout(menuView.menuLayout.menuItem)
                            }
                            // 更新菜单栏
                            $(menuDataCenter.get("id")).remakeLayout(menuView.menuLayout.menuBar)
                        }
                    }
                }
            )
        }
    }
}

/**
 * 检查版本号是否是过期版本
 * @param {String} latestVersion 最新版本号
 * @param {String} version 待检查版本号
 * @returns 过期则返回 true
 */
function isOutdated(latestVersion, version) {
    if (version.indexOf("dev") > -1) return true
    // TODO 检查版本号
    return latestVersion !== version
}

function init() {
    const update = () => {
        // 清除旧文件
        $file.delete(ROOT_PATH)
        // 复制
        $file.copy({
            src: SHARED_PATH,
            dst: ROOT_PATH
        })
        setTimeout(() => {
            $ui.toast("The update is successful and will restart soon")
            setTimeout(() => $addin.restart(), 1500)
        }, 1500)
    }
    if ($file.exists(ROOT_PATH) && $file.exists(`${ROOT_PATH}/src/kernel.js`)) {
        // 不在 widget 中运行且 SHARED_PATH 目录存在则检查更新
        if ($file.exists(SHARED_PATH) && $app.env !== $env.widget) {
            const SHARED_VERSION = eval($file.read(`${SHARED_PATH}/src/kernel.js`).string).VERSION
            if (isOutdated(VERSION, SHARED_VERSION)) {
                update()
            }
        }
    } else {
        update()
    }
}

module.exports = {
    VERSION,
    SHARED_PATH,
    init,
    isOutdated,
    // class
    Kernel,
    Page,
    PageController,
    Sheet,
    NavigationBar,
    NavigationView,
    NavigationController
}