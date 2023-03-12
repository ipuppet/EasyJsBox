const { Controller } = require("../controller")
const { FileStorage } = require("../file-storage")
const { Kernel } = require("../kernel")
const { UIKit } = require("../ui-kit")
const { Sheet } = require("../sheet")
const { NavigationView } = require("../navigation-view/navigation-view")
const { ViewController } = require("../navigation-view/view-controller")
const {
    SettingItem,
    SettingInfo,
    SettingSwitch,
    SettingString,
    SettingStepper,
    SettingScript,
    SettingTab,
    SettingMenu,
    SettingColor,
    SettingDate,
    SettingInput,
    SettingNumber,
    SettingIcon,
    SettingPush,
    SettingChild,
    SettingImage
} = require("./setting-items")

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
 * @typedef {object} ScriptAnimate
 * @property {Function} animate.start
 * @property {Function} animate.cancel
 * @property {Function} animate.done
 * @property {Function} animate.touchHighlightStart
 * @property {Function} animate.touchHighlightEnd
 *
 * 用于存放 script 类型用到的方法
 * @callback SettingMethodFunction
 * @param {ScriptAnimate} animate
 *
 * @typedef {object} SettingMethod
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
    settingItems = {}
    exclude = ["script", "info"]
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
    userGetter = false
    // read only
    #readonly = false
    // 判断是否已经加载数据加载
    #loadConfigStatus = false
    #footer

    /**
     *
     * @param {object} args
     * @param {Function} args.set 自定义 set 方法，定义后将忽略 fileStorage 和 dataFile
     * @param {Function} args.get 自定义 get 方法，定义后将忽略 fileStorage 和 dataFile
     * @param {object} args.userData 初始用户数据，定义后将忽略 fileStorage 和 dataFile
     * @param {FileStorage} args.fileStorage FileStorage 对象，用于文件操作
     * @param {string} args.dataFile 持久化数据保存文件
     * @param {object} args.structure 设置项结构
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
            this.userGetter = true
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
        this.imagePath = (args.name ?? "default") + ".image" + "/"
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

    loader(item) {
        if (this.settingItems[item.key]) {
            return this.settingItems[item.key]
        }
        if (Array.isArray(item.items)) item.items = item.items.map(item => $l10n(item))
        item.title = $l10n(item.title)
        item.setting = this

        let settingItem = null
        switch (item.type) {
            case "info":
                settingItem = SettingInfo.from(item).options(item.value)
                break
            case "switch":
                settingItem = SettingSwitch.from(item)
                break
            case "string":
                settingItem = SettingString.from(item)
                break
            case "stepper":
                settingItem = SettingStepper.from(item).options(item.min ?? 1, item.max ?? 12)
                break
            case "script":
                settingItem = SettingScript.from(item).options(item.value)
                break
            case "tab":
                settingItem = SettingTab.from(item).options(item.items, item.values)
                break
            case "menu":
                settingItem = SettingMenu.from(item).options(item.items, item.values, item.pullDown ?? false)
                break
            case "color":
                settingItem = SettingColor.from(item)
                break
            case "date":
                settingItem = SettingDate.from(item).options(item.mode)
                break
            case "input":
                settingItem = SettingInput.from(item).options(item.secure)
                break
            case "number":
                settingItem = SettingNumber.from(item)
                break
            case "icon":
                settingItem = SettingIcon.from(item).options(item.bgcolor)
                break
            case "push":
                settingItem = SettingPush.from(item).options(item.view)
                break
            case "child":
                settingItem = SettingChild.from(item).options(item.children)
                break
            case "image":
                settingItem = SettingImage.from(item)
                break
        }
        return settingItem
    }

    /**
     * 从 this.structure 加载数据
     * @returns {this}
     */
    loadConfig() {
        // 永远使用 setting 结构文件内的值
        const userData = this.userData ?? this.fileStorage.readAsJSON(this.dataFile, {})
        const setValue = structure => {
            for (let section of structure) {
                for (let item of section.items) {
                    if (item.type === "child") {
                        setValue(item.children)
                    } else if (!this.exclude.includes(item.type)) {
                        this.setting[item.key] = item.key in userData ? userData[item.key] : item.value
                        this.settingItems[item.key] = this.loader(item)
                    }
                }
            }
        }
        setValue(this.structure)
        this.#loadConfigStatus = true
        return this
    }

    hasSectionTitle(structure) {
        this.#checkLoadConfigError()
        return structure[0]?.title ? true : false
    }

    loadL10n() {
        Kernel.l10n(
            "zh-Hans",
            {
                OK: "好",
                DONE: "完成",
                CANCEL: "取消",
                CLEAR: "清除",
                BACK: "返回",
                ERROR: "发生错误",
                SUCCESS: "成功",
                INVALID_VALUE: "非法参数",
                CONFIRM_CHANGES: "数据已变化，确认修改？",

                SETTING: "设置",
                GENERAL: "一般",
                ADVANCED: "高级",
                TIPS: "小贴士",
                COLOR: "颜色",
                COPY: "复制",
                COPIED: "复制成功",

                JSBOX_ICON: "JSBox 内置图标",
                SF_SYMBOLS: "SF Symbols",
                IMAGE_BASE64: "图片 / base64",

                PREVIEW: "预览",
                SELECT_IMAGE_PHOTO: "从相册选择图片",
                SELECT_IMAGE_ICLOUD: "从 iCloud 选择图片",
                CLEAR_IMAGE: "清除图片",
                NO_IMAGE: "无图片",

                ABOUT: "关于",
                VERSION: "Version",
                AUTHOR: "作者",
                AT_BOTTOM: "已经到底啦~"
            },
            false
        )
        Kernel.l10n(
            "en",
            {
                OK: "OK",
                DONE: "Done",
                CANCEL: "Cancel",
                CLEAR: "Clear",
                BACK: "Back",
                ERROR: "Error",
                SUCCESS: "Success",
                INVALID_VALUE: "Invalid value",
                CONFIRM_CHANGES: "The data has changed, confirm the modification?",

                SETTING: "Setting",
                GENERAL: "General",
                ADVANCED: "Advanced",
                TIPS: "Tips",
                COLOR: "Color",
                COPY: "Copy",
                COPIED: "Copide",

                JSBOX_ICON: "JSBox in app icon",
                SF_SYMBOLS: "SF Symbols",
                IMAGE_BASE64: "Image / base64",

                PREVIEW: "Preview",
                SELECT_IMAGE_PHOTO: "Select From Photo",
                SELECT_IMAGE_ICLOUD: "Select From iCloud",
                CLEAR_IMAGE: "Clear Image",
                NO_IMAGE: "No Image",

                ABOUT: "About",
                VERSION: "Version",
                AUTHOR: "Author",
                AT_BOTTOM: "It's the end~"
            },
            false
        )
    }

    setUserData(userData) {
        this.userData = userData
        return this
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
        this.fileStorage.write(this.dataFile, $data({ string: JSON.stringify(this.setting) }))
        this.callEvent("onSet", key, value)
        return true
    }

    getOriginal(key, _default = null) {
        this.#checkLoadConfigError()
        if (Object.prototype.hasOwnProperty.call(this.setting, key)) return this.setting[key]
        else return _default
    }

    get(key, _default = null) {
        this.#checkLoadConfigError()
        return this.settingItems[key]?.get(_default)
    }

    #getSections(structure) {
        const sections = []
        for (let section of structure) {
            const rows = []
            for (let item of section.items) {
                let row = this.loader(item)?.create()
                if (!row) continue
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
                separatorInset: $insets(
                    0,
                    SettingItem.iconSize + SettingItem.edgeOffset * 2,
                    0,
                    SettingItem.edgeOffset
                ), // 分割线边距
                bgcolor: UIKit.scrollViewBackgroundColor,
                footer: footer,
                data: this.#getSections(structure ?? this.structure)
            },
            layout: $layout.fill,
            events: {
                rowHeight: (sender, indexPath) => {
                    const info = sender.object(indexPath)?.props?.info ?? {}
                    return info.rowHeight ?? SettingItem.rowHeight
                }
            }
        }
    }

    getNavigationView() {
        const navigationView = new NavigationView()
        navigationView.setView(this.getListView(this.structure)).navigationBarTitle($l10n("SETTING"))
        if (this.hasSectionTitle(this.structure)) {
            navigationView.navigationBar.setContentViewHeightOffset(-10)
        }
        return navigationView
    }

    getPage() {
        return this.getNavigationView().getPage()
    }
}

module.exports = {
    Setting
}
