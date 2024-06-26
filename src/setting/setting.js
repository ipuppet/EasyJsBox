const { Controller } = require("../controller")
const { FileStorage } = require("../file-storage")
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
const { Logger } = require("../logger")

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
    // 初始用户数据，若未定义则尝试从给定的文件读取
    userData
    // fileStorage
    fileStorage
    /**
     * @type {Logger}
     */
    logger
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
                .addNavBar({ title: "README", popButton: { symbol: "x.circle" } })
                .init()
                .present()
        }
    }
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
            this.getOriginal = args.get
            this.setUserData(args.userData ?? {})
        } else {
            this.fileStorage = args.fileStorage ?? new FileStorage()
            this.dataFile = args.dataFile ?? "setting.json"
        }
        if (args.structure) {
            this.setStructure(args.structure) // structure 优先级高于 structurePath
        } else {
            this.setStructurePath(args.structurePath ?? "setting.json")
        }
        this.logger = args.logger ?? new Logger()
        this.isUseJsboxNav = args.isUseJsboxNav ?? false
        // 不能使用 uuid
        this.imagePath = (args.name ?? "default") + ".image" + "/"
        this.setName(args.name ?? $text.uuid)
    }

    useJsboxNav() {
        this.isUseJsboxNav = true
        return this
    }

    #checkLoadConfig() {
        if (!this.#loadConfigStatus) {
            throw new SettingLoadConfigError()
        }
    }

    loader(item) {
        let settingItem = null
        switch (item.type) {
            case "info":
                settingItem = new SettingInfo(item)
                break
            case "switch":
                settingItem = new SettingSwitch(item)
                break
            case "string":
                settingItem = new SettingString(item)
                break
            case "stepper":
                settingItem = new SettingStepper(item).with({ min: item.min ?? 1, max: item.max ?? 12 })
                break
            case "script":
                // item.script ?? item.value 兼容旧版本
                settingItem = new SettingScript(item).with({ script: item.script ?? item.value })
                break
            case "tab":
                settingItem = new SettingTab(item).with({ items: item.items, values: item.values })
                break
            case "menu":
                settingItem = new SettingMenu(item).with({
                    items: item.items,
                    values: item.values,
                    pullDown: item.pullDown ?? false
                })
                break
            case "color":
                settingItem = new SettingColor(item)
                break
            case "date":
                settingItem = new SettingDate(item).with({ mode: item.mode })
                break
            case "input":
                settingItem = new SettingInput(item).with({ secure: item.secure })
                break
            case "number":
                settingItem = new SettingNumber(item)
                break
            case "icon":
                settingItem = new SettingIcon(item).with({ bgcolor: item.bgcolor })
                break
            case "push":
                settingItem = new SettingPush(item).with({ view: item.view, navButtons: item.navButtons })
                break
            case "child":
                settingItem = new SettingChild(item).with({ children: item.children })
                break
            case "image":
                settingItem = new SettingImage(item)
                break
            default:
                settingItem = item
                settingItem.default = item.value
                settingItem.get = (...args) => this.get(...args)
                settingItem.set = (...args) => this.set(...args)
        }
        return settingItem
    }

    /**
     * 从 this.structure 加载数据
     * @returns {this}
     */
    loadConfig() {
        this.#loadConfigStatus = false
        // 永远使用 setting 结构文件内的值
        const userData = this.userData ?? this.fileStorage.readAsJSON(this.dataFile, {})

        const setValue = structure => {
            for (let i in structure) {
                for (let j in structure[i].items) {
                    // item 指向 structure[i].items[j] 所指的对象
                    let item = structure[i].items[j]
                    if (!(item instanceof SettingItem)) {
                        // 修改 items[j] 的指向以修改原始 this.structure
                        // 此时 item 仍然指向原对象
                        structure[i].items[j] = this.loader(item)
                        // 修改 item 指向
                        item = structure[i].items[j]
                    }
                    if (!item.setting) item.setting = this

                    // 部分类型可通过此属性快速查找 tapped
                    this.settingItems[item.key] = item

                    if (item instanceof SettingChild) {
                        setValue(item.options.children)
                    } else if (!(item instanceof SettingScript || item instanceof SettingInfo)) {
                        if (item.key in userData) {
                            this.setting[item.key] = userData[item.key]
                        } else {
                            this.setting[item.key] = item.default
                        }
                    }
                }
            }
        }
        setValue(this.structure)
        this.#loadConfigStatus = true
        return this
    }

    hasSectionTitle(structure) {
        this.#checkLoadConfig()
        return structure[0]?.title ? true : false
    }

    setUserData(userData) {
        this.userData = userData
        return this
    }

    setStructure(structure) {
        this.structure = structure
        return this.loadConfig()
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

    setFooter(footer) {
        this.footer = footer
        return this
    }

    setReadonly() {
        this.#readonly = true
        return this
    }

    set(key, value) {
        if (this.#readonly) {
            throw new SettingReadonlyError()
        }
        this.#checkLoadConfig()
        this.setting[key] = value
        this.fileStorage.write(this.dataFile, $data({ string: JSON.stringify(this.setting) }))
        this.callEvent("onSet", key, value)
        return true
    }

    getOriginal(key, _default = null) {
        this.#checkLoadConfig()
        if (Object.prototype.hasOwnProperty.call(this.setting, key)) {
            return this.setting[key]
        }
        return _default
    }

    getItem(key) {
        return this.settingItems[key]
    }

    get(key, _default = null) {
        this.#checkLoadConfig()
        if (!(this.getItem(key) instanceof SettingItem)) {
            return this.getOriginal(key, _default)
        }
        return this.getItem(key).get(_default)
    }

    #getSections(structure) {
        const sections = []
        for (let section in structure) {
            const rows = []
            for (let row in structure[section].items) {
                let item = structure[section].items[row]
                // 跳过无 UI 项
                if (!(item instanceof SettingItem)) {
                    continue
                }
                rows.push(item.create())
            }
            sections.push({
                title: $l10n(structure[section].title ?? ""),
                rows: rows
            })
        }
        return sections
    }

    getListView(structure = this.structure, footer = this.footer, id = this.name) {
        return {
            type: "list",
            props: {
                id,
                style: 2,
                separatorInset: $insets(
                    0,
                    SettingItem.iconSize + SettingItem.edgeOffset * 2,
                    0,
                    SettingItem.edgeOffset
                ), // 分割线边距
                footer: footer,
                data: this.#getSections(structure)
            },
            layout: $layout.fill,
            events: {
                rowHeight: (tableView, indexPath) => {
                    const info = tableView.object(indexPath)?.props?.info ?? {}
                    return info.rowHeight ?? SettingItem.rowHeight
                },
                didSelect: async (tableView, indexPath, data) => {
                    tableView = tableView.ocValue()

                    const item = this.getItem(data.props.info.key)
                    if (typeof item?.tapped === "function") {
                        tableView.$selectRowAtIndexPath_animated_scrollPosition(indexPath.ocValue(), false, 0)
                        try {
                            await item.tapped()
                        } catch (error) {
                            this.logger.error(error)
                        }
                    }

                    tableView.$deselectRowAtIndexPath_animated(indexPath, true)
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
