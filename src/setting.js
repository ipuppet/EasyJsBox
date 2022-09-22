const { Controller } = require("./controller")
const { FileStorageFileNotFoundError, FileStorage } = require("./file-storage")
const { Kernel } = require("./kernel")
const { UIKit } = require("./ui-kit")
const { Sheet } = require("./sheet")
const { NavigationView } = require("./navigation-view/navigation-view")
const { NavigationBar } = require("./navigation-view/navigation-bar")
const { ViewController } = require("./navigation-view/view-controller")

class SettingLoadConfigError extends Error {
    constructor() {
        super("Call loadConfig() first.")
        this.name = "SettingLoadConfigError"
    }
}

class SettingReadonlyError extends Error {
    constructor() {
        super("Attempted to assign to readonly property.")
        this.name = "SettingReadonlyError"
    }
}

/**
 * 脚本类型的动画
 * @typedef {Object} ScriptAnimate
 * @property {Function} animate.actionStart
 * @property {Function} animate.actionCancel
 * @property {Function} animate.actionDone
 * @property {Function} animate.touchHighlightStart
 * @property {Function} animate.touchHighlightEnd
 *
 * 用于存放 script 类型用到的方法
 * @callback SettingMethodFunction
 * @param {ScriptAnimate} animate
 *
 * @typedef {Object} SettingMethod
 * @property {SettingMethodFunction} *
 */

/**
 * @property {function(key: string, value: any)} Setting.events.onSet 键值发生改变
 * @property {function(view: Object,title: string)} Setting.events.onChildPush 进入的子页面
 */
class Setting extends Controller {
    name
    // 存储数据
    setting = {}
    // 初始用户数据，若未定义则尝试从给定的文件读取
    userData
    // fileStorage
    fileStorage
    imagePath
    // 用来控制 child 类型
    viewController = new ViewController()
    /**
     * @type {SettingMethod}
     */
    method = {
        readme: () => {
            const content = (() => {
                const file = $device.info?.language?.startsWith("zh") ? "README_CN.md" : "README.md"
                try {
                    return __README__[file] ?? __README__["README.md"]
                } catch {
                    return $file.read(file)?.string ?? $file.read("README.md")?.string
                }
            })()
            const sheet = new Sheet()
            sheet
                .setView({
                    type: "markdown",
                    props: { content: content },
                    layout: (make, view) => {
                        make.size.equalTo(view.super)
                    }
                })
                .init()
                .present()
        }
    }
    // style
    rowHeight = 50
    edgeOffset = 10
    iconSize = 30
    // withTouchEvents 延时自动关闭高亮，防止 touchesMoved 事件未正常调用
    #withTouchEventsT = {}
    // read only
    #readonly = false
    // 判断是否已经加载数据加载
    #loadConfigStatus = false
    #footer

    /**
     *
     * @param {Object} args
     * @param {Function} args.set 自定义 set 方法，定义后将忽略 fileStorage 和 dataFile
     * @param {Function} args.get 自定义 get 方法，定义后将忽略 fileStorage 和 dataFile
     * @param {Object} args.userData 初始用户数据，定义后将忽略 fileStorage 和 dataFile
     * @param {FileStorage} args.fileStorage FileStorage 对象，用于文件操作
     * @param {string} args.dataFile 持久化数据保存文件
     * @param {Object} args.structure 设置项结构
     * @param {string} args.structurePath 结构路径，优先级低于 structure
     * @param {boolean} args.isUseJsboxNav 是否使用 JSBox 默认 nav 样式
     * @param {string} args.name 唯一名称，默认分配一个 UUID
     */
    constructor(args = {}) {
        super()

        // set 和 get 同时设置才会生效
        if (typeof args.set === "function" && typeof args.get === "function") {
            this.set = args.set
            this.get = args.get
            this.userData = args.userData
        } else {
            this.fileStorage = args.fileStorage ?? new FileStorage()
            this.dataFile = args.dataFile ?? "setting.json"
        }
        if (args.structure) {
            this.setStructure(args.structure) // structure 优先级高于 structurePath
        } else {
            this.setStructurePath(args.structurePath ?? "setting.json")
        }
        this.isUseJsboxNav = args.isUseJsboxNav ?? false
        // 不能使用 uuid
        this.imagePath = (args.name ?? "default") + ".image"
        this.setName(args.name ?? $text.uuid)
        // l10n
        this.loadL10n()
    }

    useJsboxNav() {
        this.isUseJsboxNav = true
        return this
    }

    #checkLoadConfigError() {
        if (!this.#loadConfigStatus) {
            throw new SettingLoadConfigError()
        }
    }

    /**
     * 从 this.structure 加载数据
     * @returns {this}
     */
    loadConfig() {
        const exclude = [
            "script", // script 类型永远使用setting结构文件内的值
            "info"
        ]
        const userData = this.userData ?? this.fileStorage.readAsJSON("", this.dataFile, {})
        function setValue(structure) {
            const setting = {}
            for (let section of structure) {
                for (let item of section.items) {
                    if (item.type === "child") {
                        const child = setValue(item.children)
                        Object.assign(setting, child)
                    } else if (exclude.indexOf(item.type) === -1) {
                        setting[item.key] = item.key in userData ? userData[item.key] : item.value
                    } else {
                        // 被排除的项目直接赋值
                        setting[item.key] = item.value
                    }
                }
            }
            return setting
        }
        this.setting = setValue(this.structure)
        this.#loadConfigStatus = true
        return this
    }

    hasSectionTitle(structure) {
        this.#checkLoadConfigError()
        return structure[0]["title"] ? true : false
    }

    loadL10n() {
        Kernel.l10n(
            "zh-Hans",
            `
            "OK" = "好";
            "DONE" = "完成";
            "CANCEL" = "取消";
            "CLEAR" = "清除";
            "BACK" = "返回";
            "ERROR" = "发生错误";
            "SUCCESS" = "成功";
            "LOADING" = "加载中";
            "INVALID_VALUE" = "非法参数";
            "CONFIRM_CHANGES" = "数据已变化，确认修改？";
            
            "SETTING" = "设置";
            "GENERAL" = "一般";
            "ADVANCED" = "高级";
            "TIPS" = "小贴士";
            "COLOR" = "颜色";
            "COPY" = "复制";
            "COPIED" = "复制成功";
            
            "JSBOX_ICON" = "JSBox 内置图标";
            "SF_SYMBOLS" = "SF Symbols";
            "IMAGE_BASE64" = "图片 / base64";

            "PREVIEW" = "预览";
            "SELECT_IMAGE" = "选择图片";
            "CLEAR_IMAGE" = "清除图片";
            "NO_IMAGE" = "无图片";
            
            "ABOUT" = "关于";
            "VERSION" = "Version";
            "AUTHOR" = "作者";
            "AT_BOTTOM" = "已经到底啦~";
            `,
            false
        )
        Kernel.l10n(
            "en",
            `
            "OK" = "OK";
            "DONE" = "Done";
            "CANCEL" = "Cancel";
            "CLEAR" = "Clear";
            "BACK" = "Back";
            "ERROR" = "Error";
            "SUCCESS" = "Success";
            "LOADING" = "Loading";
            "INVALID_VALUE" = "Invalid value";
            "CONFIRM_CHANGES" = "The data has changed, confirm the modification?";

            "SETTING" = "Setting";
            "GENERAL" = "General";
            "ADVANCED" = "Advanced";
            "TIPS" = "Tips";
            "COLOR" = "Color";
            "COPY" = "Copy";
            "COPIED" = "Copide";

            "JSBOX_ICON" = "JSBox in app icon";
            "SF_SYMBOLS" = "SF Symbols";
            "IMAGE_BASE64" = "Image / base64";

            "PREVIEW" = "Preview";
            "SELECT_IMAGE" = "Select Image";
            "CLEAR_IMAGE" = "Clear Image";
            "NO_IMAGE" = "No Image";

            "ABOUT" = "About";
            "VERSION" = "Version";
            "AUTHOR" = "Author";
            "AT_BOTTOM" = "It's the end~";
            `,
            false
        )
    }

    setUserData(userData) {
        this.userData = userData
    }

    setStructure(structure) {
        this.structure = structure
        return this
    }

    /**
     * 设置结构文件目录。
     * 若调用了 setStructure(structure) 或构造函数传递了 structure 数据，则不会加载结构文件
     * @param {string} structurePath
     * @returns {this}
     */
    setStructurePath(structurePath) {
        if (!this.structure) {
            this.setStructure(FileStorage.readFromRootAsJSON(structurePath))
        }
        return this
    }

    /**
     * 设置一个独一无二的名字，防止多个 Setting 导致 UI 冲突
     * @param {string} name 名字
     */
    setName(name) {
        this.name = name
        return this
    }

    setFooter(footer) {
        this.#footer = footer
        return this
    }

    set footer(footer) {
        this.#footer = footer
    }

    get footer() {
        if (this.#footer === undefined) {
            let info = FileStorage.readFromRootAsJSON("config.json", {})["info"] ?? {}
            if (!info.version || !info.author) {
                try {
                    info = __INFO__
                } catch {}
            }
            this.#footer = {}
            if (info.version && info.author) {
                this.#footer = {
                    type: "view",
                    props: { height: 70 },
                    views: [
                        {
                            type: "label",
                            props: {
                                font: $font(14),
                                text: `${$l10n("VERSION")} ${info.version} ♥ ${info.author}`,
                                textColor: $color({
                                    light: "#C0C0C0",
                                    dark: "#545454"
                                }),
                                align: $align.center
                            },
                            layout: make => {
                                make.left.right.inset(0)
                                make.top.inset(10)
                            }
                        }
                    ]
                }
            }
        }
        return this.#footer
    }

    setReadonly() {
        this.#readonly = true
        return this
    }

    set(key, value) {
        if (this.#readonly) {
            throw new SettingReadonlyError()
        }
        this.#checkLoadConfigError()
        this.setting[key] = value
        this.fileStorage.write("", this.dataFile, $data({ string: JSON.stringify(this.setting) }))
        this.callEvent("onSet", key, value)
        return true
    }

    get(key, _default = null) {
        this.#checkLoadConfigError()
        if (Object.prototype.hasOwnProperty.call(this.setting, key)) return this.setting[key]
        else return _default
    }

    getColor(color) {
        return typeof color === "string" ? $color(color) : $rgba(color.red, color.green, color.blue, color.alpha)
    }

    getImageName(key, compress = false) {
        let name = $text.MD5(key) + ".jpg"
        if (compress) {
            name = "compress." + name
        }
        return name
    }

    getImage(key, compress = false) {
        try {
            const name = this.getImageName(key, compress)
            return this.fileStorage.read(this.imagePath, name).image
        } catch (error) {
            if (error instanceof FileStorageFileNotFoundError) {
                return null
            }
            throw error
        }
    }

    getId(key) {
        return `setting-${this.name}-${key}`
    }

    #touchHighlightStart(id) {
        $(id).bgcolor = $color("systemFill")
    }

    #touchHighlightEnd(id, duration = 0.3) {
        if (duration === 0) {
            $(id).bgcolor = $color("clear")
        } else {
            $ui.animate({
                duration: duration,
                animation: () => {
                    $(id).bgcolor = $color("clear")
                }
            })
        }
    }

    #withTouchEvents(id, events, withTappedHighlight = false, highlightEndDelay = 0) {
        events = Object.assign(events, {
            touchesBegan: () => {
                this.#touchHighlightStart(id)
                // 延时自动关闭高亮，防止 touchesMoved 事件未正常调用
                this.#withTouchEventsT[id] = $delay(1, () => this.#touchHighlightEnd(id, 0))
            },
            touchesMoved: () => {
                this.#withTouchEventsT[id]?.cancel()
                this.#touchHighlightEnd(id, 0)
            }
        })
        if (withTappedHighlight) {
            const tapped = events.tapped
            events.tapped = () => {
                // highlight
                this.#touchHighlightStart(id)
                setTimeout(() => this.#touchHighlightEnd(id), highlightEndDelay * 1000)
                if (typeof tapped === "function") tapped()
            }
        }
        return events
    }

    createLineLabel(title, icon) {
        if (!icon[1]) icon[1] = "#00CC00"
        if (typeof icon[1] !== "object") {
            icon[1] = [icon[1], icon[1]]
        }
        if (typeof icon[0] !== "object") {
            icon[0] = [icon[0], icon[0]]
        }
        return {
            type: "view",
            views: [
                {
                    // icon
                    type: "view",
                    props: {
                        bgcolor: $color(icon[1][0], icon[1][1]),
                        cornerRadius: 5,
                        smoothCorners: true
                    },
                    views: [
                        {
                            type: "image",
                            props: {
                                tintColor: $color("white"),
                                image: $image(icon[0][0], icon[0][1])
                            },
                            layout: (make, view) => {
                                make.center.equalTo(view.super)
                                make.size.equalTo(20)
                            }
                        }
                    ],
                    layout: (make, view) => {
                        make.centerY.equalTo(view.super)
                        make.size.equalTo(this.iconSize)
                        make.left.inset(this.edgeOffset)
                    }
                },
                {
                    // title
                    type: "label",
                    props: {
                        text: title,
                        lines: 1,
                        textColor: this.textColor,
                        align: $align.left
                    },
                    layout: (make, view) => {
                        make.centerY.equalTo(view.super)
                        make.height.equalTo(view.super)
                        make.left.equalTo(view.prev.right).offset(this.edgeOffset)
                        make.width.greaterThanOrEqualTo(100)
                    }
                }
            ],
            layout: (make, view) => {
                make.height.centerY.equalTo(view.super)
                make.left.inset(0)
            }
        }
    }

    createInfo(icon, title, value) {
        const isArray = Array.isArray(value)
        const text = isArray ? value[0] : value
        const moreInfo = isArray ? value[1] : value
        return {
            type: "view",
            props: {
                selectable: true
            },
            views: [
                this.createLineLabel(title, icon),
                {
                    type: "label",
                    props: {
                        text: text,
                        align: $align.right,
                        textColor: $color("darkGray")
                    },
                    layout: (make, view) => {
                        make.centerY.equalTo(view.prev)
                        make.right.inset(this.edgeOffset)
                        make.width.equalTo(180)
                    }
                },
                {
                    // 监听点击动作
                    type: "view",
                    events: {
                        tapped: () => {
                            $ui.alert({
                                title: title,
                                message: moreInfo,
                                actions: [
                                    {
                                        title: $l10n("COPY"),
                                        handler: () => {
                                            $clipboard.text = moreInfo
                                            $ui.toast($l10n("COPIED"))
                                        }
                                    },
                                    { title: $l10n("OK") }
                                ]
                            })
                        }
                    },
                    layout: (make, view) => {
                        make.right.inset(0)
                        make.size.equalTo(view.super)
                    }
                }
            ],
            layout: $layout.fill
        }
    }

    createSwitch(key, icon, title) {
        const id = this.getId(key)
        return {
            type: "view",
            props: {
                id,
                selectable: true
            },
            views: [
                this.createLineLabel(title, icon),
                {
                    type: "switch",
                    props: {
                        on: this.get(key),
                        onColor: $color("#00CC00")
                    },
                    events: {
                        changed: sender => {
                            try {
                                this.set(key, sender.on)
                            } catch (error) {
                                // 恢复开关状态
                                sender.on = !sender.on
                                throw error
                            }
                        }
                    },
                    layout: (make, view) => {
                        make.centerY.equalTo(view.prev)
                        make.right.inset(this.edgeOffset)
                    }
                }
            ],
            layout: $layout.fill
        }
    }

    createString(key, icon, title) {
        const id = this.getId(key)
        return {
            type: "view",
            props: {
                id,
                selectable: true
            },
            views: [
                this.createLineLabel(title, icon),
                {
                    type: "button",
                    props: {
                        symbol: "square.and.pencil",
                        bgcolor: $color("clear"),
                        tintColor: $color("primaryText")
                    },
                    events: {
                        tapped: sender => {
                            const popover = $ui.popover({
                                sourceView: sender,
                                sourceRect: sender.bounds,
                                directions: $popoverDirection.down,
                                size: $size(320, 150),
                                views: [
                                    {
                                        type: "text",
                                        props: {
                                            id: `${this.name}-string-${key}`,
                                            align: $align.left,
                                            text: this.get(key)
                                        },
                                        layout: make => {
                                            make.left.right.inset(10)
                                            make.top.inset(20)
                                            make.height.equalTo(90)
                                        }
                                    },
                                    {
                                        type: "button",
                                        props: {
                                            symbol: "checkmark",
                                            bgcolor: $color("clear"),
                                            titleEdgeInsets: 10,
                                            contentEdgeInsets: 0
                                        },
                                        layout: make => {
                                            make.right.inset(10)
                                            make.bottom.inset(25)
                                            make.size.equalTo(30)
                                        },
                                        events: {
                                            tapped: () => {
                                                this.set(key, $(`${this.name}-string-${key}`).text)
                                                popover.dismiss()
                                            }
                                        }
                                    }
                                ]
                            })
                        }
                    },
                    layout: (make, view) => {
                        make.centerY.equalTo(view.prev)
                        make.right.inset(0)
                        make.size.equalTo(50)
                    }
                }
            ],
            layout: $layout.fill
        }
    }

    createStepper(key, icon, title, min, max) {
        const id = this.getId(key)
        const labelId = `${id}-label`
        return {
            type: "view",
            props: {
                id,
                selectable: true
            },
            views: [
                this.createLineLabel(title, icon),
                {
                    type: "label",
                    props: {
                        id: labelId,
                        text: this.get(key),
                        textColor: this.textColor,
                        align: $align.left
                    },
                    layout: (make, view) => {
                        make.height.equalTo(view.super)
                        make.right.inset(120)
                    }
                },
                {
                    type: "stepper",
                    props: {
                        min: min,
                        max: max,
                        value: this.get(key)
                    },
                    events: {
                        changed: sender => {
                            $(labelId).text = sender.value
                            try {
                                this.set(key, sender.value)
                            } catch (error) {
                                // 恢复标签显示数据
                                $(labelId).text = this.get(key)
                                throw error
                            }
                        }
                    },
                    layout: (make, view) => {
                        make.centerY.equalTo(view.prev)
                        make.right.inset(this.edgeOffset)
                    }
                }
            ],
            layout: $layout.fill
        }
    }

    createScript(key, icon, title, script) {
        const id = this.getId(key)
        const buttonId = `${id}-button`
        const actionStart = () => {
            // 隐藏 button，显示 spinner
            $(buttonId).alpha = 0
            $(`${buttonId}-spinner`).alpha = 1
            this.#touchHighlightStart(id)
        }
        const actionCancel = () => {
            $(buttonId).alpha = 1
            $(`${buttonId}-spinner`).alpha = 0
            this.#touchHighlightEnd(id)
        }
        const actionDone = (status = true, message = $l10n("ERROR")) => {
            $(`${buttonId}-spinner`).alpha = 0
            this.#touchHighlightEnd(id)
            const button = $(buttonId)
            if (!status) {
                // 失败
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
                                button.symbol = "chevron.right"
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
        return {
            type: "view",
            props: {
                id
            },
            views: [
                this.createLineLabel(title, icon),
                {
                    type: "view",
                    views: [
                        {
                            // 仅用于显示图片
                            type: "image",
                            props: {
                                id: buttonId,
                                symbol: "chevron.right",
                                tintColor: $color("secondaryText")
                            },
                            layout: (make, view) => {
                                make.centerY.equalTo(view.super)
                                make.right.inset(0)
                                make.size.equalTo(15)
                            }
                        },
                        {
                            type: "spinner",
                            props: {
                                id: `${buttonId}-spinner`,
                                loading: true,
                                alpha: 0
                            },
                            layout: (make, view) => {
                                make.size.equalTo(view.prev)
                                make.left.top.equalTo(view.prev)
                            }
                        }
                    ],
                    layout: (make, view) => {
                        make.right.inset(this.edgeOffset)
                        make.height.equalTo(this.rowHeight)
                        make.width.equalTo(view.super)
                    }
                }
            ],
            events: this.#withTouchEvents(id, {
                tapped: () => {
                    /**
                     * @type {ScriptAnimate}
                     */
                    const animate = {
                        actionStart: actionStart, // 会出现加载动画
                        actionCancel: actionCancel, // 会直接恢复箭头图标
                        actionDone: actionDone, // 会出现对号，然后恢复箭头
                        touchHighlightStart: () => this.#touchHighlightStart(id), // 被点击的一行颜色加深
                        touchHighlightEnd: () => this.#touchHighlightEnd(id) // 被点击的一行颜色恢复
                    }
                    // 执行代码
                    if (typeof script === "function") {
                        script(animate)
                    } else if (script.startsWith("this")) {
                        // 传递 animate 对象
                        eval(`(()=>{return ${script}(animate)})()`)
                    } else {
                        eval(script)
                    }
                }
            }),
            layout: $layout.fill
        }
    }

    createTab(key, icon, title, items, values) {
        if (typeof items === "string") {
            items = eval(`(()=>{return ${items}()})()`)
        } else if (typeof items === "function") {
            items = items()
        }
        if (typeof values === "string") {
            values = eval(`(()=>{return ${values}()})()`)
        } else if (typeof values === "function") {
            values = values()
        }

        const id = this.getId(key)
        const isCustomizeValues = items?.length > 0 && values?.length === items?.length
        return {
            type: "view",
            props: {
                id,
                selectable: true
            },
            views: [
                this.createLineLabel(title, icon),
                {
                    type: "tab",
                    props: {
                        items: items ?? [],
                        index: isCustomizeValues ? values.indexOf(this.get(key)) : this.get(key),
                        dynamicWidth: true
                    },
                    layout: (make, view) => {
                        make.right.inset(this.edgeOffset)
                        make.centerY.equalTo(view.prev)
                    },
                    events: {
                        changed: sender => {
                            if (isCustomizeValues) {
                                this.set(key, values[sender.index])
                            } else {
                                this.set(key, sender.index)
                            }
                        }
                    }
                }
            ],
            layout: $layout.fill
        }
    }

    createMenu(key, icon, title, items, values) {
        const id = this.getId(key)
        const labelId = `${id}-label`

        // 数据生成函数
        const getItems = () => {
            let res
            if (typeof items === "string") {
                res = eval(`(()=>{return ${items}()})()`)
            } else if (typeof items === "function") {
                res = items()
            } else {
                res = items ?? []
            }
            return res
        }
        const getValues = () => {
            let res
            if (typeof values === "string") {
                res = eval(`(()=>{return ${values}()})()`)
            } else if (typeof values === "function") {
                res = values()
            } else {
                res = values
            }
            return res
        }

        const tmpItems = getItems()
        const tmpValues = getValues()

        const isCustomizeValues = tmpItems?.length > 0 && tmpValues?.length === tmpItems?.length

        return {
            type: "view",
            props: {
                id,
                selectable: true
            },
            views: [
                this.createLineLabel(title, icon),
                {
                    type: "view",
                    views: [
                        {
                            type: "label",
                            props: {
                                text: isCustomizeValues
                                    ? tmpItems[tmpValues.indexOf(this.get(key))]
                                    : tmpItems[this.get(key)],
                                color: $color("secondaryText"),
                                id: labelId
                            },
                            layout: (make, view) => {
                                make.right.inset(0)
                                make.height.equalTo(view.super)
                            }
                        }
                    ],
                    layout: (make, view) => {
                        make.right.inset(this.edgeOffset)
                        make.height.equalTo(this.rowHeight)
                        make.width.equalTo(view.super)
                    }
                }
            ],
            events: {
                tapped: () => {
                    const tmpItems = getItems()
                    const tmpValues = getValues()
                    $ui.menu({
                        items: tmpItems,
                        handler: (title, idx) => {
                            if (isCustomizeValues) {
                                this.set(key, tmpValues[idx])
                            } else {
                                this.set(key, idx)
                            }
                            $(labelId).text = $l10n(title)
                        }
                    })
                }
            },
            layout: $layout.fill
        }
    }

    createColor(key, icon, title) {
        const id = this.getId(key)
        const colorId = `${id}-color`
        return {
            type: "view",
            props: {
                id,
                selectable: true
            },
            views: [
                this.createLineLabel(title, icon),
                {
                    type: "view",
                    views: [
                        {
                            // 颜色预览以及按钮功能
                            type: "view",
                            props: {
                                id: colorId,
                                bgcolor: this.getColor(this.get(key)),
                                circular: true,
                                borderWidth: 1,
                                borderColor: $color("#e3e3e3")
                            },
                            layout: (make, view) => {
                                make.centerY.equalTo(view.super)
                                make.right.inset(this.edgeOffset)
                                make.size.equalTo(20)
                            }
                        },
                        {
                            // 用来监听点击事件，增大可点击面积
                            type: "view",
                            events: {
                                tapped: async () => {
                                    const color = await $picker.color({ color: this.getColor(this.get(key)) })
                                    this.set(key, color.components)
                                    $(colorId).bgcolor = $rgba(
                                        color.components.red,
                                        color.components.green,
                                        color.components.blue,
                                        color.components.alpha
                                    )
                                }
                            },
                            layout: (make, view) => {
                                make.right.inset(0)
                                make.height.width.equalTo(view.super.height)
                            }
                        }
                    ],
                    layout: (make, view) => {
                        make.height.equalTo(this.rowHeight)
                        make.width.equalTo(view.super)
                    }
                }
            ],
            layout: $layout.fill
        }
    }

    createDate(key, icon, title, mode = 2) {
        const id = this.getId(key)
        const getFormatDate = date => {
            let str = ""
            if (typeof date === "number") date = new Date(date)
            switch (mode) {
                case 0:
                    str = date.toLocaleTimeString()
                    break
                case 1:
                    str = date.toLocaleDateString()
                    break
                case 2:
                    str = date.toLocaleString()
                    break
            }
            return str
        }
        return {
            type: "view",
            props: {
                id,
                selectable: true
            },
            views: [
                this.createLineLabel(title, icon),
                {
                    type: "view",
                    views: [
                        {
                            type: "label",
                            props: {
                                id: `${id}-label`,
                                color: $color("secondaryText"),
                                text: this.get(key) ? getFormatDate(this.get(key)) : "None"
                            },
                            layout: (make, view) => {
                                make.right.inset(0)
                                make.height.equalTo(view.super)
                            }
                        }
                    ],
                    events: {
                        tapped: async () => {
                            const settingData = this.get(key)
                            const date = await $picker.date({
                                props: {
                                    mode: mode,
                                    date: settingData ? settingData : Date.now()
                                }
                            })
                            this.set(key, date.getTime())
                            $(`${id}-label`).text = getFormatDate(date)
                        }
                    },
                    layout: (make, view) => {
                        make.right.inset(this.edgeOffset)
                        make.height.equalTo(this.rowHeight)
                        make.width.equalTo(view.super)
                    }
                }
            ],
            layout: $layout.fill
        }
    }

    createNumber(key, icon, title) {
        return this.createInput(key, icon, title, false, $kbType.decimal, text => {
            const isNumber = str => {
                const reg = /^[0-9]+.?[0-9]*$/
                return reg.test(str)
            }
            if (text === "" || !isNumber(text)) {
                $ui.toast($l10n("INVALID_VALUE"))
                return false
            }

            return this.set(key, Number(text))
        })
    }

    createInput(key, icon, title, secure = false, kbType = $kbType.default, saveFunc) {
        if (saveFunc === undefined) {
            saveFunc = data => {
                return this.set(key, data)
            }
        }
        const id = this.getId(key)
        const inputId = id + "-input"
        return {
            type: "view",
            props: {
                id,
                selectable: true
            },
            views: [
                this.createLineLabel(title, icon),
                {
                    type: "input",
                    props: {
                        id: inputId,
                        type: kbType,
                        align: $align.right,
                        bgcolor: $color("clear"),
                        textColor: $color("secondaryText"),
                        text: this.get(key),
                        secure: secure,
                        accessoryView: UIKit.blurBox({ height: 44 }, [
                            UIKit.separatorLine({}, UIKit.align.top),
                            {
                                type: "button",
                                props: {
                                    title: $l10n("DONE"),
                                    bgcolor: $color("clear"),
                                    titleColor: $color("primaryText")
                                },
                                layout: (make, view) => {
                                    make.right.inset(this.edgeOffset)
                                    make.centerY.equalTo(view.super)
                                },
                                events: {
                                    tapped: () => {
                                        const sender = $(inputId)
                                        if (saveFunc(sender.text)) {
                                            sender.blur()
                                        }
                                    }
                                }
                            },
                            {
                                type: "button",
                                props: {
                                    title: $l10n("CANCEL"),
                                    bgcolor: $color("clear"),
                                    titleColor: $color("primaryText")
                                },
                                layout: (make, view) => {
                                    make.left.inset(this.edgeOffset)
                                    make.centerY.equalTo(view.super)
                                },
                                events: {
                                    tapped: () => {
                                        const sender = $(inputId)
                                        const savedData = this.get(key, "")
                                        if (sender.text !== savedData) {
                                            sender.text = savedData
                                        }
                                        sender.blur()
                                    }
                                }
                            }
                        ])
                    },
                    layout: (make, view) => {
                        // 与标题间距 this.edgeOffset
                        make.left.equalTo(view.prev.get("label").right).offset(this.edgeOffset)
                        make.right.inset(this.edgeOffset)
                        make.width.greaterThanOrEqualTo(50)
                        make.height.equalTo(view.super)
                    },
                    events: {
                        didBeginEditing: sender => {
                            // 使输入可见
                            sender.secure = false
                            // 防止键盘遮挡
                            if (!$app.autoKeyboardEnabled) {
                                $app.autoKeyboardEnabled = true
                            }
                        },
                        returned: sender => {
                            if (saveFunc(sender.text)) {
                                sender.blur()
                            }
                        },
                        didEndEditing: async sender => {
                            const savedData = this.get(key, "")
                            if (sender.text !== String(savedData)) {
                                const res = await $ui.alert({
                                    title: $l10n("CONFIRM_CHANGES"),
                                    message: `${savedData}\n===============\n${sender.text}`,
                                    actions: [{ title: $l10n("OK") }, { title: $l10n("CANCEL") }]
                                })
                                if (res.index === 0) {
                                    if (!saveFunc(sender.text)) {
                                        sender.text = savedData
                                    }
                                } else {
                                    sender.text = savedData
                                }
                            }

                            // 恢复 secure
                            if (secure) {
                                sender.secure = secure
                            }
                        }
                    }
                }
            ],
            layout: $layout.fill
        }
    }

    /**
     *
     * @param {string} key
     * @param {string} icon
     * @param {string} title
     * @param {Object} events
     * @param {string|Object} bgcolor 指定预览时的背景色，默认 "#000000"
     * @returns {Object}
     */
    createIcon(key, icon, title, bgcolor = "#000000") {
        const id = this.getId(key)
        const imageId = `${id}-image`
        return {
            type: "view",
            props: {
                id,
                selectable: true
            },
            views: [
                this.createLineLabel(title, icon),
                {
                    type: "view",
                    views: [
                        {
                            type: "image",
                            props: {
                                cornerRadius: 8,
                                bgcolor: typeof bgcolor === "string" ? $color(bgcolor) : bgcolor,
                                smoothCorners: true
                            },
                            layout: (make, view) => {
                                make.right.inset(this.edgeOffset)
                                make.centerY.equalTo(view.super)
                                make.size.equalTo($size(30, 30))
                            }
                        },
                        {
                            type: "image",
                            props: {
                                id: imageId,
                                image: $image(this.get(key)),
                                icon: $icon(this.get(key).slice(5, this.get(key).indexOf(".")), $color("#ffffff")),
                                tintColor: $color("#ffffff")
                            },
                            layout: (make, view) => {
                                make.right.equalTo(view.prev).offset(-5)
                                make.centerY.equalTo(view.super)
                                make.size.equalTo($size(20, 20))
                            }
                        }
                    ],
                    events: {
                        tapped: () => {
                            $ui.menu({
                                items: [$l10n("JSBOX_ICON"), $l10n("SF_SYMBOLS"), $l10n("IMAGE_BASE64")],
                                handler: async (title, idx) => {
                                    if (idx === 0) {
                                        const icon = await $ui.selectIcon()
                                        this.set(key, icon)
                                        $(imageId).icon = $icon(icon.slice(5, icon.indexOf(".")), $color("#ffffff"))
                                    } else if (idx === 1 || idx === 2) {
                                        $input.text({
                                            text: "",
                                            placeholder: title,
                                            handler: text => {
                                                if (text === "") {
                                                    $ui.toast($l10n("INVALID_VALUE"))
                                                    return
                                                }
                                                this.set(key, text)
                                                if (idx === 1) $(imageId).symbol = text
                                                else $(imageId).image = $image(text)
                                            }
                                        })
                                    }
                                }
                            })
                        }
                    },
                    layout: (make, view) => {
                        make.right.inset(0)
                        make.height.equalTo(this.rowHeight)
                        make.width.equalTo(view.super)
                    }
                }
            ],
            layout: $layout.fill
        }
    }

    createChild(key, icon, title, children) {
        const id = this.getId(key)
        return {
            type: "view",
            layout: $layout.fill,
            props: {
                id,
                selectable: true
            },
            views: [
                this.createLineLabel(title, icon),
                {
                    // 仅用于显示图片
                    type: "image",
                    props: {
                        symbol: "chevron.right",
                        tintColor: $color("secondaryText")
                    },
                    layout: (make, view) => {
                        make.centerY.equalTo(view.super)
                        make.right.inset(this.edgeOffset)
                        make.size.equalTo(15)
                    }
                }
            ],
            events: {
                tapped: () => {
                    setTimeout(() => {
                        if (this.events?.onChildPush) {
                            this.callEvent("onChildPush", this.getListView(children, {}), title)
                        } else {
                            if (this.isUseJsboxNav) {
                                UIKit.push({
                                    title: title,
                                    bgcolor: UIKit.scrollViewBackgroundColor,
                                    views: [this.getListView(children, {})]
                                })
                            } else {
                                const navigationView = new NavigationView()
                                navigationView.setView(this.getListView(children, {})).navigationBarTitle(title)
                                navigationView.navigationBarItems.addPopButton()
                                navigationView.navigationBar.setLargeTitleDisplayMode(
                                    NavigationBar.largeTitleDisplayModeNever
                                )
                                if (this.hasSectionTitle(children)) {
                                    navigationView.navigationBar.setContentViewHeightOffset(-10)
                                }
                                this.viewController.push(navigationView)
                            }
                        }
                    })
                }
            }
        }
    }

    createImage(key, icon, title) {
        const id = this.getId(key)
        const imageId = `${id}-image`
        return {
            type: "view",
            props: {
                id,
                selectable: true
            },
            views: [
                this.createLineLabel(title, icon),
                {
                    type: "view",
                    views: [
                        {
                            type: "image",
                            props: {
                                id: imageId,
                                image: this.getImage(key, true) ?? $image("questionmark.square.dashed")
                            },
                            layout: (make, view) => {
                                make.right.inset(this.edgeOffset)
                                make.centerY.equalTo(view.super)
                                make.size.equalTo($size(30, 30))
                            }
                        }
                    ],
                    events: {
                        tapped: () => {
                            this.#touchHighlightStart(id)
                            $ui.menu({
                                items: [$l10n("PREVIEW"), $l10n("SELECT_IMAGE"), $l10n("CLEAR_IMAGE")],
                                handler: (title, idx) => {
                                    if (idx === 0) {
                                        const image = this.getImage(key)
                                        if (image) {
                                            $quicklook.open({
                                                image: image
                                            })
                                        } else {
                                            $ui.toast($l10n("NO_IMAGE"))
                                        }
                                    } else if (idx === 1) {
                                        $photo.pick({ format: "data" }).then(resp => {
                                            $ui.toast($l10n("LOADING"))
                                            if (!resp.status || !resp.data) {
                                                if (resp?.error?.description !== "canceled") {
                                                    $ui.toast($l10n("ERROR"))
                                                }
                                                return
                                            }
                                            // 控制压缩图片大小
                                            const image = Kernel.compressImage(resp.data.image)
                                            this.fileStorage.write(
                                                this.imagePath,
                                                this.getImageName(key, true),
                                                image.jpg(0.8)
                                            )
                                            this.fileStorage.write(this.imagePath, this.getImageName(key), resp.data)
                                            $(imageId).image = image
                                            $ui.success($l10n("SUCCESS"))
                                        })
                                    } else if (idx === 2) {
                                        this.fileStorage.delete(this.imagePath, this.getImageName(key, true))
                                        this.fileStorage.delete(this.imagePath, this.getImageName(key))
                                        $(imageId).image = $image("questionmark.square.dashed")
                                        $ui.success($l10n("SUCCESS"))
                                    }
                                },
                                finished: () => {
                                    this.#touchHighlightEnd(id)
                                }
                            })
                        }
                    },
                    layout: (make, view) => {
                        make.right.inset(0)
                        make.height.equalTo(this.rowHeight)
                        make.width.equalTo(view.super)
                    }
                }
            ],
            layout: $layout.fill
        }
    }

    #getSections(structure) {
        const sections = []
        for (let section of structure) {
            const rows = []
            for (let item of section.items) {
                const value = this.get(item.key)
                let row = null
                if (!item.icon) item.icon = ["square.grid.2x2.fill", "#00CC00"]
                if (typeof item.items === "object") item.items = item.items.map(item => $l10n(item))
                // 更新标题值
                item.title = $l10n(item.title)
                switch (item.type) {
                    case "switch":
                        row = this.createSwitch(item.key, item.icon, item.title)
                        break
                    case "stepper":
                        row = this.createStepper(item.key, item.icon, item.title, item.min ?? 1, item.max ?? 12)
                        break
                    case "string":
                        row = this.createString(item.key, item.icon, item.title)
                        break
                    case "info":
                        row = this.createInfo(item.icon, item.title, value)
                        break
                    case "script":
                        row = this.createScript(item.key, item.icon, item.title, value)
                        break
                    case "tab":
                        row = this.createTab(item.key, item.icon, item.title, item.items, item.values)
                        break
                    case "menu":
                        row = this.createMenu(item.key, item.icon, item.title, item.items, item.values)
                        break
                    case "color":
                        row = this.createColor(item.key, item.icon, item.title)
                        break
                    case "date":
                        row = this.createDate(item.key, item.icon, item.title, item.mode)
                        break
                    case "number":
                        row = this.createNumber(item.key, item.icon, item.title)
                        break
                    case "input":
                        row = this.createInput(item.key, item.icon, item.title, item.secure)
                        break
                    case "icon":
                        row = this.createIcon(item.key, item.icon, item.title, item.bgcolor)
                        break
                    case "child":
                        row = this.createChild(item.key, item.icon, item.title, item.children)
                        break
                    case "image":
                        row = this.createImage(item.key, item.icon, item.title)
                        break
                    default:
                        continue
                }
                rows.push(row)
            }
            sections.push({
                title: $l10n(section.title ?? ""),
                rows: rows
            })
        }
        return sections
    }

    getListView(structure, footer = this.footer) {
        return {
            type: "list",
            props: {
                id: this.name,
                style: 2,
                separatorInset: $insets(0, this.iconSize + this.edgeOffset * 2, 0, this.edgeOffset), // 分割线边距
                bgcolor: UIKit.scrollViewBackgroundColor,
                footer: footer,
                data: this.#getSections(structure ?? this.structure)
            },
            layout: $layout.fill,
            events: {
                rowHeight: (sender, indexPath) => {
                    const info = sender.object(indexPath)?.props?.info ?? {}
                    return info.rowHeight ?? this.rowHeight
                }
            }
        }
    }

    getPageView() {
        const navigationView = new NavigationView()
        navigationView.setView(this.getListView(this.structure)).navigationBarTitle($l10n("SETTING"))
        if (this.hasSectionTitle(this.structure)) {
            navigationView.navigationBar.setContentViewHeightOffset(-10)
        }
        return navigationView.getPage()
    }
}

module.exports = {
    Setting
}
