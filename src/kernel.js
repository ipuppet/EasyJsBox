const VERSION = "0.3.5"
const ROOT_PATH = "/EasyJsBox" // JSBox path, not nodejs
const SHARED_PATH = "shared://EasyJsBox"

class UIKit {
    constructor(kernel) {
        this.kernel = kernel
        // 通用样式
        this.blurStyle = $blurStyle.thinMaterial
        this.textColor = $color("primaryText", "secondaryText")
        this.linkColor = $color("systemLink")
        // 本地化
        this.loadL10n()
    }

    loadL10n() {
        // pushPageSheet
        this.kernel.l10n("zh-Hans", {
            "DONE": "完成"
        })
        this.kernel.l10n("en", {
            "DONE": "Done"
        })
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

    pushPageSheet(args) {
        const navTop = 50,
            views = args.views,
            title = args.title ?? "",
            navButtons = args.navButtons ?? [],
            topOffset = args.topOffset ?? true,
            done = args.done,
            doneText = args.doneText ?? $l10n("DONE")
        const UIModalPresentationStyle = { pageSheet: 1 }
        const { width, height } = $device.info.screen
        const UIView = $objc("UIView").invoke("initWithFrame", $rect(0, 0, width, height))
        const PSViewController = $objc("UIViewController").invoke("alloc.init")
        const PSViewControllerView = PSViewController.$view()
        {
            PSViewControllerView.$setBackgroundColor($color("primarySurface"))
            PSViewControllerView.$addSubview(UIView)
            PSViewController.$setModalPresentationStyle(UIModalPresentationStyle.pageSheet)
        }
        const present = () => $ui.vc.ocValue().invoke("presentModalViewController:animated", PSViewController, true)
        const dismiss = () => PSViewController.invoke("dismissModalViewControllerAnimated", true)
        const add = view => PSViewControllerView.jsValue().add(view)
        add({
            type: "view",
            layout: $layout.fill,
            views: [
                {
                    type: "view",
                    views: views,
                    layout: (make, view) => {
                        if (topOffset) make.top.equalTo(view.super.safeArea).offset(navTop)
                        else make.top.equalTo(view.super.safeArea)
                        make.bottom.equalTo(view.super)
                        make.left.right.equalTo(view.super.safeArea)
                    }
                },
                { // nav
                    type: "view",
                    props: {
                        //bgcolor: $color("blue")
                    },
                    layout: (make, view) => {
                        make.height.equalTo(navTop)
                        make.top.width.equalTo(view.super)
                    },
                    views: [
                        { // blur
                            type: "blur",
                            props: { style: this.blurStyle },
                            layout: $layout.fill
                        },
                        { // canvas
                            type: "canvas",
                            layout: (make, view) => {
                                make.top.equalTo(view.prev.bottom)
                                make.height.equalTo(1 / $device.info.screen.scale)
                                make.left.right.inset(0)
                            },
                            events: {
                                draw: (view, ctx) => {
                                    const width = view.frame.width
                                    const scale = $device.info.screen.scale
                                    ctx.strokeColor = $color("gray")
                                    ctx.setLineWidth(1 / scale)
                                    ctx.moveToPoint(0, 0)
                                    ctx.addLineToPoint(width, 0)
                                    ctx.strokePath()
                                }
                            }
                        },
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
                                        title: doneText,
                                        bgcolor: $color("clear"),
                                        font: $font(16),
                                        titleColor: $color("systemLink")
                                    },
                                    events: {
                                        tapped: () => {
                                            dismiss()
                                            if (done) done()
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
                            ].concat(navButtons)
                        }
                    ]
                }
            ]
        })
        present()
    }

    /**
     * 重新设计$ui.push()
     * @param {Object} args 参数
     * {
            views: [],
            title: "",
            parent: "",
            navButtons: [],
            topOffset: true, // 这样会导致nav的磨砂效果消失，因为视图不会被nav遮挡
            disappeared: () => { },
        }
     */
    push(args) {
        const navTop = 45,
            views = args.views,
            title = args.title ?? "",
            parent = args.parent ?? $l10n("BACK"),
            navButtons = args.navButtons ?? [],
            topOffset = args.topOffset ?? true,
            bgcolor = args.bgcolor ?? "primarySurface",
            disappeared = args.disappeared
        $ui.push({
            props: {
                navBarHidden: true,
                statusBarStyle: 0,
                bgcolor: $color(bgcolor),
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
                        if (topOffset) make.top.equalTo(view.super.safeArea).offset(navTop)
                        else make.top.equalTo(view.super.safeArea)
                        make.bottom.equalTo(view.super)
                        make.left.right.equalTo(view.super.safeArea)
                    }
                },
                {
                    type: "view",
                    layout: (make, view) => {
                        make.left.top.right.inset(0)
                        make.bottom.equalTo(view.super.safeAreaTop).offset(navTop)
                    },
                    views: [
                        { // blur
                            type: "blur",
                            props: { style: this.blurStyle },
                            layout: $layout.fill
                        },
                        { // canvas
                            type: "canvas",
                            layout: (make, view) => {
                                make.top.equalTo(view.prev.bottom)
                                make.height.equalTo(1 / $device.info.screen.scale)
                                make.left.right.inset(0)
                            },
                            events: {
                                draw: (view, ctx) => {
                                    const width = view.frame.width
                                    const scale = $device.info.screen.scale
                                    ctx.strokeColor = $color("gray")
                                    ctx.setLineWidth(1 / scale)
                                    ctx.moveToPoint(0, 0)
                                    ctx.addLineToPoint(width, 0)
                                    ctx.strokePath()
                                }
                            }
                        },
                        { // view
                            type: "view",
                            layout: (make, view) => {
                                make.size.left.top.equalTo(view.super.safeArea)
                            },
                            views: [
                                { // 返回按钮
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
                                    events: {
                                        tapped: () => { $ui.pop() }
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
                            ].concat(navButtons)
                        },
                    ]
                }
            ]
        })
    }

    /**
     * 用于创建一个靠右侧按钮（自动布局）
     * @param {String} id 不可重复
     * @param {String} symbol symbol图标（目前只用symbol）
     * @param {CallableFunction} tapped 按钮点击事件，会传入三个函数，start()、done()和cancel()
     *     调用 start() 表明按钮被点击，准备开始动画
     *     调用 done() 表明您的操作已经全部完成，默认操作成功完成，播放一个按钮变成对号的动画
     *                 若第一个参数传出false则表示运行出错
     *                 第二个参数为错误原因($ui.toast(message))
     *      调用 cancel() 表示取消操作
     *     示例：
     *      (start, done, cancel) => {
     *          start()
     *          const upload = (data) => { return false }
     *          if(upload(data)) { done() }
     *          else { done(false, "Upload Error!") }
     *      }
     */
    navButton(id, symbol, tapped, hidden) {
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
                        hidden: hidden,
                        tintColor: this.textColor,
                        symbol: symbol,
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
                    make.right.equalTo(view.prev.left)
                } else {
                    make.right.inset(0)
                }
            }
        }
    }

    underline() {
        return { // canvas
            type: "canvas",
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
}

class DataCenter {
    constructor() {
        this.data = {}
    }
    set(key, value) {
        this.data[key] = value
    }

    get(key, _default) {
        const res = this.data[key]
        return res === undefined ? _default : res
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
        if ($file.exists("/config.json")) {
            const config = JSON.parse($file.read("/config.json").string)
            this.name = config.info.name
        }
        this.UIKit = new UIKit(this)
    }

    uuid() {
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

    l10n(language, content) {
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

    getExtFile(path, sharedPath) {
        const copyFile = () => {
            $file.copy({
                src: sharedPath,
                dst: path
            })
        }
        if (!$file.exists(path)) { // 从 shared 复制
            if ($file.exists(sharedPath)) {
                copyFile()
            } else {
                return false
            }
        } else { // 检查更新
            if ($app.env !== $env.widget) {
                const { VERSION } = require(path)
                if ($file.exists(sharedPath)) {
                    const SHARED_VERSION = eval($file.read(sharedPath).string).VERSION
                    if (isOutdated(VERSION, SHARED_VERSION)) {
                        copyFile()
                    }
                }
            }
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
        const sharedComponentPath = `${this.path.shared.components}/${component}.js`
        this.getExtFile(componentPath, sharedComponentPath)
        const { Controller, View } = require(componentPath)
        // 新实例
        const dataCenter = new DataCenter()
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
        const sharedPluginPath = `${this.path.shared.plugins}/${plugin}.js`
        this.getExtFile(pluginPath, sharedPluginPath)
        const { Plugin, VERSION } = require(pluginPath)
        this.plugins[plugin] = {
            plugin: Plugin,
            version: VERSION
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
            $ui.render({
                type: "view",
                props: {
                    navBarHidden: true,
                    titleColor: $color("primaryText"),
                    barColor: $color("primarySurface"),
                    statusBarStyle: 0
                },
                layout: $layout.fill,
                views: [
                    this.components.page.view.getView(),
                    this.components.menu.view.getView()
                ],
                events: {
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
            })
        }
    }
}

/**
 * 检查版本号是否是过期版本
 * @param {String} thisVersion 当前版本号
 * @param {String} version 待检查版本号
 * @returns 过期则返回 true
 */
function isOutdated(thisVersion, version) {
    if (version.indexOf("dev") > -1) return true
    // TODO 检查版本号
    return thisVersion !== version
}

function init() {
    const copyFile = () => {
        // 清除旧文件
        $file.delete(`${ROOT_PATH}/src/kernel.js`)
        $file.delete(`${ROOT_PATH}/LICENSE`)
        // 创建结构
        JSON.parse($file.read(`${SHARED_PATH}/structure.json`).string).forEach(dir => {
            $file.mkdir(`${ROOT_PATH}${dir}`)
        })
        // 复制 kernel
        $file.copy({
            src: `${SHARED_PATH}/src/kernel.js`,
            dst: `${ROOT_PATH}/src/kernel.js`
        })
        // 复制证书文件
        $file.copy({
            src: `${SHARED_PATH}/LICENSE`,
            dst: `${ROOT_PATH}/LICENSE`
        })
    }
    if ($file.exists(ROOT_PATH)) {
        // 不在 widget 中运行且 SHARED_PATH 目录存在则检查更新
        if ($file.exists(SHARED_PATH) && $app.env !== $env.widget) {
            const SHARED_VERSION = eval($file.read(`${SHARED_PATH}/src/kernel.js`).string).VERSION
            if (isOutdated(VERSION, SHARED_VERSION)) {
                copyFile()
            }
        }
    } else {
        copyFile()
    }
}

module.exports = { Kernel, VERSION, SHARED_PATH, init }