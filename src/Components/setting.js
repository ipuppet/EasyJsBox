class Controller {
    constructor(data) {
        Object.assign(this, data)
        this.args.savePath = this.args.savePath ? this.args.savePath : "/assets/setting.json"
        this._setName(this.args.savePath.replace("/", "-"))
        if (this.args.structure) {
            this.structure = this.args.structure
        } else {
            if (!this.args.structurePath) this.args.structurePath = "/setting.json"
            this.structure = JSON.parse($file.read(this.args.structurePath).string)
        }
        this._loadConfig()
        // 是否全屏显示
        this.dataCenter.set("secondaryPage", false)
        // 注册调色板插件
        if (typeof $picker.color !== "function")
            this.kernel.registerPlugin("palette")
        // l10n
        this.loadL10n()
    }

    loadL10n() {
        this.kernel.l10n("zh-Hans", `
        "OK" = "好";
        "CANCEL" = "取消";
        "CLEAR" = "清除";
        "BACK" = "返回";
        "ERROR" = "发生错误";
        "SUCCESS" = "成功";
        "INVALID_VALUE" = "非法参数";
        
        "SETTING" = "设置";
        "GENERAL" = "一般";
        "ADVANCED" = "高级";
        "TIPS" = "小贴士";
        "COLOR" = "颜色";
        "COPY" = "复制";
        "COPY_SUCCESS" = "复制成功";
        
        "JSBOX_ICON" = "JSBox 内置图标";
        "SF_SYMBOLS" = "SF Symbols";
        "IMAGE_BASE64" = "图片/ base64";
        
        "ABOUT" = "关于";
        "VERSION" = "Version";
        "AUTHOR" = "作者";
        "AT_BOTTOM" = "已经到底啦~";
        `)
        this.kernel.l10n("en", `
        "OK" = "Ok";
        "CANCEL" = "Cancel";
        "CLEAR" = "Clear";
        "BACK" = "Back";
        "ERROR" = "Error";
        "SUCCESS" = "Success";
        "INVALID_VALUE" = "Invalid value";

        "SETTING" = "Setting";
        "GENERAL" = "General";
        "ADVANCED" = "Advanced";
        "TIPS" = "Tips";
        "COLOR" = "Color";
        "COPY" = "Copy";
        "COPY_SUCCESS" = "Copy success";

        "JSBOX_ICON" = "JSBox in app icon";
        "SF_SYMBOLS" = "SF Symbols";
        "IMAGE_BASE64" = "Image/base64";

        "ABOUT" = "About";
        "VERSION" = "Version";
        "AUTHOR" = "Author";
        "AT_BOTTOM" = "It's the end~";
        `)
    }

    getView() {
        return this.view.getView()
    }

    /**
     * 设置一个独一无二的名字，防止多个setting冲突
     * @param {String} name 名字
     */
    _setName(name) {
        this.dataCenter.set("name", name)
    }

    _loadConfig() {
        this.setting = {}
        let user = {}
        const exclude = [
            "script", // script 类型永远使用setting结构文件内的值
            "info"
        ]
        if ($file.exists(this.args.savePath)) {
            user = JSON.parse($file.read(this.args.savePath).string)
        }
        for (let section of this.structure) {
            for (let item of section.items) {
                if (exclude.indexOf(item.type) < 0) {
                    this.setting[item.key] = item.key in user ? user[item.key] : item.value
                } else { // 被排除的项目直接赋值
                    this.setting[item.key] = item.value
                }
            }
        }
    }

    /**
     * 是否是二级页面
     * @param {Boolean} secondaryPage 
     */
    isSecondaryPage(secondaryPage, pop) {
        this.dataCenter.set("secondaryPage", secondaryPage)
        if (secondaryPage)
            this.dataCenter.set("pop", pop)
    }

    setFooter(footer) {
        this.dataCenter.set("footer", footer)
    }

    get(key) {
        return this.setting[key]
    }

    /**
     * 设置一个钩子，在set方法调用时触发
     * @param {CallableFunction} hook 
     */
    setHook(hook) {
        this.hook = hook
    }

    set(key, value) {
        this.setting[key] = value
        $file.write({
            data: $data({ string: JSON.stringify(this.setting) }),
            path: this.args.savePath
        })
        if (this.hook) this.hook(key, value)
        return true
    }
}

class View {
    /**
     * 
     * @param {Object} data 
     * data { UIKit: this.UIKit, dataCenter }
     */
    constructor(data) {
        Object.assign(this, data)
        // 样式
        this.titleSize = 35
        this.titleSizeMax = 40
        this.titleOffset = 50
        this.topOffset = -10
    }

    setInfo(info) {
        this.info = info
    }

    updateSetting(key, value) {
        return this.controller.set(key, value)
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
                {// icon
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
                        },
                    ],
                    layout: (make, view) => {
                        make.centerY.equalTo(view.super)
                        make.size.equalTo(30)
                        make.left.inset(10)
                    }
                },
                {// title
                    type: "label",
                    props: {
                        text: title,
                        textColor: this.textColor,
                        align: $align.left
                    },
                    layout: (make, view) => {
                        make.centerY.equalTo(view.super)
                        make.height.equalTo(view.super)
                        make.left.equalTo(view.prev.right).offset(10)
                    }
                }
            ],
            layout: (make, view) => {
                make.centerY.equalTo(view.super)
                make.height.equalTo(view.super)
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
                        make.right.inset(15)
                        make.width.equalTo(180)
                    }
                },
                {// 监听点击动作
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
                                            $ui.toast($l10n("COPY_SUCCESS"))
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

    createSwitch(key, icon, title, events) {
        return {
            type: "view",
            views: [
                this.createLineLabel(title, icon),
                {
                    type: "switch",
                    props: {
                        on: this.controller.get(key),
                        onColor: $color("#00CC00")
                    },
                    events: {
                        changed: sender => {
                            if (!this.updateSetting(key, sender.on)) {
                                sender.on = !sender.on
                            } else {
                                if (events) eval(`(()=>{return ${events}})()`)
                            }
                        }
                    },
                    layout: (make, view) => {
                        make.centerY.equalTo(view.prev)
                        make.right.inset(15)
                    }
                }
            ],
            layout: $layout.fill
        }
    }

    createString(key, icon, title, events) {
        return {
            type: "view",
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
                                            id: key,
                                            align: $align.left,
                                            text: this.controller.get(key)
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
                                                if (this.updateSetting(key, $(key).text)) {
                                                    popover.dismiss()
                                                    if (events) eval(`(()=>{return ${events}})()`)
                                                }
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

    createNumber(key, icon, title, events) {
        return {
            type: "view",
            views: [
                this.createLineLabel(title, icon),
                {
                    type: "label",
                    props: {
                        id: key,
                        align: $align.right,
                        text: this.controller.get(key)
                    },
                    events: {
                        tapped: () => {
                            $input.text({
                                type: $kbType.number,
                                text: this.controller.get(key),
                                placeholder: title,
                                handler: (text) => {
                                    const isNumber = (str) => {
                                        const reg = /^[0-9]+.?[0-9]*$/
                                        return reg.test(str)
                                    }
                                    if (text === "" || !isNumber(text)) {
                                        $ui.toast($l10n("INVALID_VALUE"))
                                        return
                                    }
                                    if (this.updateSetting(key, text)) {
                                        $(key).text = text
                                        if (events) eval(`(()=>{return ${events}})()`)
                                    }
                                }
                            })
                        }
                    },
                    layout: (make, view) => {
                        make.centerY.equalTo(view.prev)
                        make.right.inset(15)
                        make.height.equalTo(50)
                        make.width.equalTo(100)
                    }
                }
            ],
            layout: $layout.fill
        }
    }

    createStepper(key, icon, title, min, max, events) {
        return {
            type: "view",
            views: [
                this.createLineLabel(title, icon),
                {
                    type: "label",
                    props: {
                        id: key,
                        text: this.controller.get(key),
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
                        value: this.controller.get(key)
                    },
                    events: {
                        changed: (sender) => {
                            $(key).text = sender.value
                            if (!this.updateSetting(key, sender.value)) {
                                $(key).text = this.controller.get(key)
                            } else {
                                if (events) eval(`(()=>{return ${events}})()`)
                            }
                        }
                    },
                    layout: (make, view) => {
                        make.centerY.equalTo(view.prev)
                        make.right.inset(15)
                    }
                }
            ],
            layout: $layout.fill
        }
    }

    createScript(key, icon, title, script) {
        const id = `script-${this.dataCenter.get("name")}-${key}`
        const touchHighlightStart = () => {
            $(`${id}-line`).bgcolor = $color("insetGroupedBackground")
        }
        const touchHighlightEnd = (duration = 0.2) => {
            $ui.animate({
                duration: duration,
                animation: () => {
                    $(`${id}-line`).bgcolor = $color("clear")
                }
            })
        }
        const touchHighlight = () => {
            touchHighlightStart()
            touchHighlightEnd(0.5)
        }
        const actionStart = () => {
            // 隐藏button，显示spinner
            $(id).alpha = 0
            $(`${id}-spinner`).alpha = 1
            touchHighlightStart()
        }
        const actionCancel = () => {
            $(id).alpha = 1
            $(`${id}-spinner`).alpha = 0
            touchHighlightEnd()
        }
        const actionDone = (status = true, message = $l10n("ERROR")) => {
            $(`${id}-spinner`).alpha = 0
            touchHighlightEnd()
            const button = $(id)
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
            props: { id: `${id}-line` },
            views: [
                this.createLineLabel(title, icon),
                {
                    type: "view",
                    views: [
                        {// 仅用于显示图片
                            type: "image",
                            props: {
                                id: id,
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
                                id: `${id}-spinner`,
                                loading: true,
                                alpha: 0
                            },
                            layout: (make, view) => {
                                make.size.equalTo(view.prev)
                                make.left.top.equalTo(view.prev)
                            }
                        },
                        {// 覆盖在图片上监听点击动作
                            type: "view",
                            events: {
                                tapped: () => {
                                    // 生成开始事件和结束事件动画，供函数调用
                                    const animate = {
                                        actionStart: actionStart,
                                        actionCancel: actionCancel,
                                        actionDone: actionDone,
                                        touchHighlight: touchHighlight,
                                        touchHighlightStart: touchHighlightStart,
                                        touchHighlightEnd: touchHighlightEnd
                                    }
                                    // 执行代码
                                    eval(`(()=>{return ${script}(animate)})()`)
                                }
                            },
                            layout: (make, view) => {
                                make.right.inset(0)
                                make.size.equalTo(view.super)
                            }
                        }
                    ],
                    layout: (make, view) => {
                        make.right.inset(15)
                        make.height.equalTo(50)
                        make.width.equalTo(view.super)
                    }
                }
            ],
            layout: $layout.fill
        }
    }

    createTab(key, icon, title, items, events, withTitle) {
        return {
            type: "view",
            views: [
                this.createLineLabel(title, icon),
                {
                    type: "tab",
                    props: {
                        items: items,
                        index: this.controller.get(key),
                        dynamicWidth: true
                    },
                    layout: (make, view) => {
                        make.right.inset(15)
                        make.centerY.equalTo(view.prev)
                    },
                    events: {
                        changed: (sender) => {
                            const value = withTitle ? [sender.index, title] : sender.index
                            this.updateSetting(key, value)
                            if (events) eval(`(()=>{return ${events}})()`)
                        }
                    }
                }
            ],
            layout: $layout.fill
        }
    }

    createColor(key, icon, title, events) {
        return {
            type: "view",
            views: [
                this.createLineLabel(title, icon),
                {
                    type: "view",
                    views: [
                        {// 颜色预览以及按钮功能
                            type: "view",
                            props: {
                                id: `setting-${this.dataCenter.get("name")}-color-${key}`,
                                bgcolor: $color(this.controller.get(key)),
                                circular: true,
                                borderWidth: 1,
                                borderColor: $color("#e3e3e3")
                            },
                            layout: (make, view) => {
                                make.centerY.equalTo(view.super)
                                make.right.inset(15)
                                make.size.equalTo(20)
                            }
                        },
                        { // 用来监听点击事件，增大可点击面积
                            type: "view",
                            events: {
                                tapped: async () => {
                                    if (typeof $picker.color === "function") {
                                        const newColor = await $picker.color({ color: $color(this.controller.get(key).trim()) })
                                        this.updateSetting(key, newColor.hexCode)
                                        if (events) eval(`(()=>{return ${events}})()`)
                                        $(`setting-${this.dataCenter.get("name")}-color-${key}`).bgcolor = $color(newColor.hexCode)
                                    } else {
                                        const Palette = this.controller.kernel.getPlugin("palette").plugin
                                        const palette = new Palette()
                                        let color = this.controller.get(key).trim()
                                        if (typeof color === "string" && color !== "") {
                                            color = $color(color)
                                        } else {
                                            color = $(`setting-${this.dataCenter.get("name")}-color-${key}`).bgcolor
                                        }
                                        const navButtons = [
                                            {
                                                type: "button",
                                                props: {
                                                    symbol: "checkmark",
                                                    tintColor: this.textColor,
                                                    bgcolor: $color("clear")
                                                },
                                                layout: make => {
                                                    make.right.inset(10)
                                                    make.size.equalTo(20)
                                                },
                                                events: {
                                                    tapped: () => {
                                                        const rgb = palette.rgb
                                                        const newColor = Palette.RGB2HEX(rgb[0], rgb[1], rgb[2])
                                                        this.updateSetting(key, newColor)
                                                        if (events) eval(`(()=>{return ${events}})()`)
                                                        $(`setting-${this.dataCenter.get("name")}-color-${key}`).bgcolor = $color(newColor)
                                                        $ui.pop()
                                                    }
                                                }
                                            }
                                        ]
                                        palette.setRGB(color.components.red, color.components.green, color.components.blue)
                                        this.UIKit.push({
                                            views: [palette.getView()],
                                            title: $l10n("COLOR"),
                                            navButtons: navButtons
                                        })
                                    }
                                }
                            },
                            layout: (make, view) => {
                                make.right.inset(0)
                                make.height.width.equalTo(view.super.height)
                            }
                        }
                    ],
                    layout: (make, view) => {
                        make.height.equalTo(50)
                        make.width.equalTo(view.super)
                    }
                }
            ],
            layout: $layout.fill
        }
    }

    createMenu(key, icon, title, items, events, withTitle) {
        const id = `setting-menu-${this.dataCenter.get("name")}-${key}`
        return {
            type: "view",
            props: { id: `${id}-line` },
            views: [
                this.createLineLabel(title, icon),
                {
                    type: "view",
                    views: [
                        {
                            type: "label",
                            props: {
                                text: withTitle ? items[(() => {
                                    const value = this.controller.get(key)
                                    if (typeof value === "object") return value[0]
                                    else return value
                                })()] : items[this.controller.get(key)],
                                color: $color("secondaryText"),
                                id: id
                            },
                            layout: (make, view) => {
                                make.right.inset(0)
                                make.height.equalTo(view.super)
                            }
                        }
                    ],
                    layout: (make, view) => {
                        make.right.inset(15)
                        make.height.equalTo(50)
                        make.width.equalTo(view.super)
                    }
                }
            ],
            events: {
                tapped: () => {
                    $(`${id}-line`).bgcolor = $color("insetGroupedBackground")
                    $ui.menu({
                        items: items,
                        handler: (title, idx) => {
                            const value = withTitle ? [idx, title] : idx
                            this.updateSetting(key, value)
                            if (events) eval(`(()=>{return ${events}})()`)
                            $(id).text = $l10n(title)
                        },
                        finished: () => {
                            $ui.animate({
                                duration: 0.2,
                                animation: () => {
                                    $(`${id}-line`).bgcolor = $color("clear")
                                }
                            })
                        }
                    })
                }
            },
            layout: $layout.fill
        }
    }

    createDate(key, icon, title, mode = 2, events) {
        const id = `setting-date-${this.dataCenter.get("name")}-${key}`
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
            views: [
                this.createLineLabel(title, icon),
                {
                    type: "view",
                    views: [{
                        type: "label",
                        props: {
                            id: `${id}-label`,
                            color: $color("secondaryText"),
                            text: this.controller.get(key) ? getFormatDate(this.controller.get(key)) : "None"
                        },
                        layout: (make, view) => {
                            make.right.inset(0)
                            make.height.equalTo(view.super)

                        }
                    }],
                    events: {
                        tapped: async () => {
                            const settingData = this.controller.get(key)
                            const date = await $picker.date({
                                props: {
                                    mode: mode,
                                    date: settingData ? settingData : Date.now()
                                }
                            })
                            if (events) eval(`(()=>{return ${events}})()`)
                            this.updateSetting(key, date.getTime())
                            $(`${id}-label`).text = getFormatDate(date)
                        }
                    },
                    layout: (make, view) => {
                        make.right.inset(15)
                        make.height.equalTo(50)
                        make.width.equalTo(view.super)
                    }
                }
            ],
            layout: $layout.fill
        }
    }

    createInput(key, icon, title, events) {
        const id = `setting-input-${this.dataCenter.get("name")}-${key}`
        return {
            type: "view",
            views: [
                this.createLineLabel(title, icon),
                {
                    type: "view",
                    views: [{
                        type: "label",
                        props: {
                            id: `${id}-label`,
                            color: $color("secondaryText"),
                            text: this.controller.get(key)
                        },
                        layout: (make, view) => {
                            make.right.inset(0)
                            make.height.equalTo(view.super)

                        }
                    }],
                    events: {
                        tapped: async () => {
                            $input.text({
                                text: this.controller.get(key),
                                placeholder: title,
                                handler: (text) => {
                                    if (text === "") {
                                        $ui.toast($l10n("INVALID_VALUE"))
                                        return
                                    }
                                    if (this.updateSetting(key, text)) {
                                        $(`${id}-label`).text = text
                                        if (events) eval(`(()=>{return ${events}})()`)
                                    }
                                }
                            })
                        }
                    },
                    layout: (make, view) => {
                        make.right.inset(15)
                        make.height.equalTo(50)
                        make.width.equalTo(view.super)
                    }
                }
            ],
            layout: $layout.fill
        }
    }

    createIcon(key, icon, title, events) {
        const id = `setting-icon-${this.dataCenter.get("name")}-${key}`
        return {
            type: "view",
            views: [
                this.createLineLabel(title, icon),
                {
                    type: "view",
                    views: [
                        {
                            type: "image",
                            props: {
                                cornerRadius: 8,
                                bgcolor: $color("#000000"),
                                smoothCorners: true
                            },
                            layout: (make, view) => {
                                make.right.inset(15)
                                make.centerY.equalTo(view.super)
                                make.size.equalTo($size(30, 30))
                            }
                        },
                        {
                            type: "image",
                            props: {
                                id: id,
                                image: $image(this.controller.get(key)),
                                icon: $icon(this.controller.get(key).slice(5, this.controller.get(key).indexOf(".")), $color("#ffffff")),
                                tintColor: $color("#ffffff")
                            },
                            layout: (make, view) => {
                                make.right.inset(20)
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
                                        this.updateSetting(key, icon)
                                        $(id).icon = $icon(icon.slice(5, icon.indexOf(".")), $color("#ffffff"))
                                        if (events) eval(`(()=>{return ${events}})()`)
                                    } else if (idx === 1 || idx === 2) {
                                        $input.text({
                                            text: "",
                                            placeholder: title,
                                            handler: text => {
                                                if (text === "") {
                                                    $ui.toast($l10n("INVALID_VALUE"))
                                                    return
                                                }
                                                this.updateSetting(key, text)
                                                if (idx === 1) $(id).symbol = text
                                                else $(id).image = $image(text)
                                                if (events) eval(`(()=>{return ${events}})()`)
                                            }
                                        })
                                    }
                                }
                            })
                        }
                    },
                    layout: (make, view) => {
                        make.right.inset(0)
                        make.height.equalTo(50)
                        make.width.equalTo(view.super)
                    }
                }
            ],
            layout: $layout.fill
        }
    }

    createChild(key, icon, title, children) {
        const id = `setting-child-${this.dataCenter.get("name")}-${key}`
        return {
            type: "view",
            layout: $layout.fill,
            views: [
                this.createLineLabel(title, icon),
                {// 仅用于显示图片
                    type: "image",
                    props: {
                        symbol: "chevron.right",
                        tintColor: $color("secondaryText")
                    },
                    layout: (make, view) => {
                        make.centerY.equalTo(view.super)
                        make.right.inset(15)
                        make.size.equalTo(15)
                    }
                }
            ],
            props: { id: id },
            events: {
                tapped: () => {
                    this.UIKit.push({
                        title: title,
                        topOffset: false,
                        views: this.defaultList({
                            tupe: "view",
                            props: { height: 60 }
                        }, {}, this.getSections(children), {}, true)
                    })
                }
            }
        }
    }

    getView() {
        const secondaryPage = this.dataCenter.get("secondaryPage")
        const info = JSON.parse($file.read("/config.json").string)["info"]
        const header = secondaryPage ? {} : this.UIKit.headerTitle(`setting-title-${this.dataCenter.get("name")}`, $l10n("SETTING"))
        const footer = this.dataCenter.get("footer", {
            type: "view",
            props: { height: 130 },
            views: [
                {
                    type: "label",
                    props: {
                        font: $font(14),
                        text: `${$l10n("VERSION")} ${info.version} © ${info.author}`,
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
        })
        return this.defaultList(header, footer, this.getSections(this.controller.structure), {}, secondaryPage)
    }

    getSections(structure) {
        const sections = []
        for (let section of structure) {
            const rows = []
            for (let item of section.items) {
                const value = this.controller.get(item.key)
                let row = null
                if (!item.icon) item.icon = ["square.grid.2x2.fill", "#00CC00"]
                if (typeof item.items === "object") item.items = item.items.map(item => $l10n(item))
                // 更新标题值
                item.title = $l10n(item.title)
                switch (item.type) {
                    case "switch":
                        row = this.createSwitch(item.key, item.icon, item.title, item.events)
                        break
                    case "stepper":
                        row = this.createStepper(item.key, item.icon, item.title, item.min === undefined ? 1 : item.min, item.max === undefined ? 12 : item.max, item.events)
                        break
                    case "string":
                        row = this.createString(item.key, item.icon, item.title, item.events)
                        break
                    case "number":
                        row = this.createNumber(item.key, item.icon, item.title, item.events)
                        break
                    case "info":
                        row = this.createInfo(item.icon, item.title, value)
                        break
                    case "script":
                        row = this.createScript(item.key, item.icon, item.title, value)
                        break
                    case "tab":
                        row = this.createTab(item.key, item.icon, item.title, item.items, item.events, item.withTitle)
                        break
                    case "color":
                        row = this.createColor(item.key, item.icon, item.title, item.events)
                        break
                    case "menu":
                        if (typeof item.items === "string") {
                            item.items = eval(`(()=>{return ${item.items}()})()`)
                        }
                        row = this.createMenu(item.key, item.icon, item.title, item.items, item.events, item.withTitle)
                        break
                    case "date":
                        row = this.createDate(item.key, item.icon, item.title, item.mode, item.events)
                        break
                    case "input":
                        row = this.createInput(item.key, item.icon, item.title, item.events)
                        break
                    case "icon":
                        row = this.createIcon(item.key, item.icon, item.title, item.events)
                        break
                    case "child":
                        row = this.createChild(item.key, item.icon, item.title, item.children)
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

    /**
     * 标准列表视图
     * @param {Object} header 该对象中需要包含一个标题label的id和title (info: { id: id, title: title }) 供动画使用
     * @param {*} footer 视图对象
     * @param {*} data
     * @param {*} events
     */
    defaultList(header, footer, data, events = {}, secondaryPage) {
        if (secondaryPage === undefined) secondaryPage = this.dataCenter.get("secondaryPage")
        return [
            {
                type: "view",
                props: { bgcolor: $color("insetGroupedBackground") },
                views: [
                    {
                        type: "view",
                        layout: (make, view) => {
                            make.top.left.right.equalTo(view.super.safeArea)
                            make.bottom.inset(0)
                        },
                        views: [{
                            type: "list",
                            props: {
                                style: 2,
                                separatorInset: $insets(0, 50, 0, 10), // 分割线边距
                                rowHeight: 50,
                                indicatorInsets: $insets(50, 0, secondaryPage ? 0 : 50, 0),
                                header: header,
                                sectionTitleHeight: 30,
                                footer: footer,
                                data: data
                            },
                            events: Object.assign(secondaryPage ? {} : { // 若设置了显示为二级页面则不监听
                                didScroll: sender => {
                                    // 下拉放大字体
                                    if (sender.contentOffset.y <= this.topOffset) {
                                        let size = 35 - sender.contentOffset.y * 0.04
                                        if (size > this.titleSizeMax)
                                            size = this.titleSizeMax
                                        $(header.info.id).font = $font("bold", size)
                                    }
                                    // 顶部信息栏
                                    if (sender.contentOffset.y >= 5) {
                                        $ui.animate({
                                            duration: 0.2,
                                            animation: () => {
                                                $(header.info.id + "-header").alpha = 1
                                            }
                                        })
                                        if (sender.contentOffset.y > 40) {
                                            $ui.animate({
                                                duration: 0.2,
                                                animation: () => {
                                                    $(header.info.id + "-header-title").alpha = 1
                                                    $(header.info.id).alpha = 0
                                                }
                                            })
                                        } else {
                                            $ui.animate({
                                                duration: 0.2,
                                                animation: () => {
                                                    $(header.info.id + "-header-title").alpha = 0
                                                    $(header.info.id).alpha = 1
                                                }
                                            })
                                        }
                                    } else if (sender.contentOffset.y < 5) {
                                        $ui.animate({
                                            duration: 0.2,
                                            animation: () => {
                                                $(header.info.id + "-header").alpha = 0

                                            }
                                        })
                                    }
                                }
                            }, events),
                            layout: $layout.fill
                        }]
                    }
                ].concat(secondaryPage ? [] : {// 顶部bar，用于显示 设置 字样
                    type: "view",
                    props: {
                        id: header.info.id + "-header",
                        alpha: 0
                    },
                    layout: (make, view) => {
                        make.left.top.right.inset(0)
                        make.bottom.equalTo(view.super.safeAreaTop).offset(45)
                    },
                    views: [
                        {
                            type: "blur",
                            props: { style: this.UIKit.blurStyle },
                            layout: $layout.fill
                        },
                        {
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
                        { // 标题
                            type: "label",
                            props: {
                                id: header.info.id + "-header-title",
                                alpha: 0,
                                text: header.info.title,
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
                    ]
                }),
                layout: $layout.fill
            }
        ]
    }
}

module.exports = { Controller, View, VERSION: "1.0.1" }