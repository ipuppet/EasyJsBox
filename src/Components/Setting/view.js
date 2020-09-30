const UIBase = require("../../Foundation/ui-base")

class View extends UIBase {
    constructor(controller) {
        this.controller = controller
        this.titleSize = 35
        this.titleSizeMax = 40
        this.titleOffset = 50
        this.topOffset = -10
    }

    setInfo(info) {
        // 默认读取"/config.json"中的内容
        this.info = info ? info : JSON.parse($file.read("/config.json"))["info"]
    }

    updateSetting(key, value) {
        return this.kernel.setting.set(key, value)
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
        let isArray = Array.isArray(value)
        let text = isArray ? value[0] : value
        let moreInfo = isArray ? value[1] : value
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

    createSwitch(key, icon, title, on = true) {
        return {
            type: "view",
            views: [
                this.createLineLabel(title, icon),
                {
                    type: "switch",
                    props: {
                        on: on,
                        onColor: $color("#00CC00")
                    },
                    events: {
                        changed: sender => {
                            if (!this.updateSetting(key, sender.on)) {
                                sender.on = !sender.on
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

    createString(key, icon, title, text = "") {
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
                                            text: text
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
                        make.right.inset(15)
                        make.size.equalTo(50)
                    }
                }
            ],
            layout: $layout.fill
        }
    }

    createNumber(key, icon, title, number = "") {
        return {
            type: "view",
            views: [
                this.createLineLabel(title, icon),
                {
                    type: "label",
                    props: {
                        id: key,
                        align: $align.right,
                        text: number
                    },
                    events: {
                        tapped: () => {
                            $input.text({
                                type: $kbType.number,
                                text: number,
                                placeholder: title,
                                handler: (text) => {
                                    const isNumber = (str) => {
                                        let reg = /^[0-9]+.?[0-9]*$/
                                        return reg.test(str)
                                    }
                                    if (text === "" || !isNumber(text)) {
                                        $ui.toast($l10n("INVALID_VALUE"))
                                        return
                                    }
                                    if (this.updateSetting(key, text)) {
                                        $(key).text = text
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

    createStepper(key, icon, title, value = 1, min = 1, max = 12) {
        return {
            type: "view",
            views: [
                this.createLineLabel(title, icon),
                {
                    type: "label",
                    props: {
                        id: key,
                        text: value,
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
                        value: value
                    },
                    events: {
                        changed: (sender) => {
                            $(key).text = sender.value
                            if (!this.updateSetting(key, sender.value)) {
                                $(key).text = this.kernel.setting.get(key)
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

    scriptButton(id, symbol, tapped) {
        let actionStart = () => {
            // 隐藏button，显示spinner
            $(id).alpha = 0
            $("spinner-" + id).alpha = 1
        }

        let actionDone = (status = true, message = $l10n("ERROR")) => {
            $("spinner-" + id).alpha = 0
            let button = $(id)
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
                        bgcolor: $color("clear")
                    },
                    events: {
                        tapped: () => {
                            tapped(actionStart, actionDone)
                        }
                    },
                    layout: (make, view) => {
                        make.size.equalTo(view.super)
                    }
                },
                {
                    type: "spinner",
                    props: {
                        id: "spinner-" + id,
                        loading: true,
                        alpha: 0
                    },
                    layout: (make, view) => {
                        make.size.equalTo(view.prev)
                    }
                }
            ],
            layout: (make, view) => {
                make.size.equalTo(20)
                if (view.prev) {
                    make.right.equalTo(view.prev.left).offset(-20)
                } else {
                    make.right.inset(20)
                }
            }
        }
    }

    createScript(icon, title, script) {
        let id = `script-${title}`
        let actionStart = () => {
            // 隐藏button，显示spinner
            $(id).alpha = 0
            $(`script-spinner-${id}`).alpha = 1
        }

        let actionCancel = () => {
            $(id).alpha = 1
            $(`script-spinner-${id}`).alpha = 0
        }

        let actionDone = (status = true, message = $l10n("ERROR")) => {
            $(`script-spinner-${id}`).alpha = 0
            let button = $(id)
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
                                id: `script-spinner-${id}`,
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
                                    this.start = actionStart
                                    this.cancel = actionCancel
                                    this.done = actionDone
                                    // 执行代码
                                    eval(script)
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

    createTab(key, icon, title, items, value) {
        for (let i = 0; i < items.length; i++) {
            items[i] = $l10n(items[i])
        }
        return {
            type: "view",
            views: [
                this.createLineLabel(title, icon),
                {
                    type: "tab",
                    props: {
                        items: items,
                        index: value,
                        dynamicWidth: true
                    },
                    layout: (make, view) => {
                        make.right.inset(15)
                        make.centerY.equalTo(view.prev)
                    },
                    events: {
                        changed: (sender) => {
                            this.updateSetting(key, sender.index)
                        }
                    }
                }
            ],
            layout: $layout.fill
        }
    }

    getViews() {
        let header = this.headerTitle("setting-title", $l10n("SETTING"))
        let footer = {
            type: "view",
            props: { height: 130 },
            views: [
                {
                    type: "label",
                    props: {
                        font: $font(14),
                        text: `${$l10n("VERSION")} ${this.info.version} © ${this.info.author}`,
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
        return this.standardList(header, footer, this.getSections())
    }

    getSections() {
        let sections = []
        for (let section of this.kernel.setting.struct) {
            let rows = []
            for (let item of section.items) {
                let value = this.kernel.setting.get(item.key)
                let row = null
                if (!item.icon) item.icon = ["square.grid.2x2.fill", "#00CC00"]
                switch (item.type) {
                    case "switch":
                        row = this.createSwitch(item.key, item.icon, $l10n(item.title), value)
                        break
                    case "stepper":
                        row = this.createStepper(item.key, item.icon, $l10n(item.title), value, 1, 12)
                        break
                    case "string":
                        row = this.createString(item.key, item.icon, $l10n(item.title), value)
                        break
                    case "number":
                        row = this.createNumber(item.key, item.icon, $l10n(item.title), value)
                        break
                    case "info":
                        row = this.createInfo(item.icon, $l10n(item.title), value)
                        break
                    case "script":
                        row = this.createScript(item.icon, $l10n(item.title), value)
                        break
                    case "tab":
                        row = this.createTab(item.key, item.icon, $l10n(item.title), item.items, value)
                        break
                    default:
                        continue
                }
                rows.push(row)
            }
            sections.push({
                title: $l10n(section.title),
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
    standardList(header, footer, data, events = {}) {
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
                                separatorInset: $insets(0, 50, 0, 10),
                                rowHeight: 50,
                                indicatorInsets: $insets(55, 0, 50, 0),
                                header: header,
                                footer: footer,
                                data: data
                            },
                            events: Object.assign({
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
                    },
                    {// 顶部bar，用于显示 设置 字样
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
                                props: { style: this.blurStyle },
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
                                        let width = view.frame.width
                                        let scale = $device.info.screen.scale
                                        ctx.strokeColor = $color("gray")
                                        ctx.setLineWidth(1 / scale)
                                        ctx.moveToPoint(0, 0)
                                        ctx.addLineToPoint(width, 0)
                                        ctx.strokePath()
                                    }
                                }
                            },
                            {
                                type: "view",
                                layout: $layout.fill,
                                views: [{
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
                                }]
                            }
                        ]
                    }
                ],
                layout: $layout.fill
            }
        ]
    }
}

module.exports = View