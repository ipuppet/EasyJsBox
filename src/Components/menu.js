class Controller {
    constructor(data) {
        Object.assign(this, data)
        this.dataCenter.set("selectedMenu", 0)
    }

    getView() {
        return this.view.getView()
    }

    /**
     * 设置切换菜单时的回调函数
     * @param {*} callback 回调函数
     */
    setCallback(callback) {
        this.callback = callback
    }

    setMenus(menus) {
        this.dataCenter.set("menus", menus)
    }

    setSelectedMenu(selected) {
        this.dataCenter.set("selectedMenu", selected)
    }

    setWidth(width) {
        this.dataCenter.set("width", width)
    }
}

class View {
    constructor(data) {
        Object.assign(this, data)
        // init
        this.dataCenter.set("itemIdPrefix", "menu-item-")
        this.dataCenter.set("id", "menu")
        this.selected = this.dataCenter.get("selectedMenu") // 当前菜单
    }

    /**
     * 切换菜单时触发
     * @param {int} from 切换前菜单的索引
     * @param {int} to 切换后菜单的索引
     */
    change(from, to) {
        this.controller.callback(from, to)
    }

    getMenuWidth() {
        const windowWidth = this.UIKit.getWindowSize().width
        return this.dataCenter.get("width", windowWidth)
    }

    /**
     * 菜单视图
     */
    menuItemTemplate() {
        const views = []
        for (let i = 0; i < this.dataCenter.get("menus").length; i++) {
            // 整理menus 格式化单个icon和多个icon的menu
            const menu = this.dataCenter.get("menus")[i]
            if (typeof menu.icon !== "object") {
                menu.icon = [menu.icon, menu.icon]
            } else if (menu.icon.length === 1) {
                menu.icon = [menu.icon[0], menu.icon[0]]
            }
            // menu模板
            const menuTemplate = {
                info: {
                    index: i,
                    icon: {
                        id: `${this.dataCenter.get("itemIdPrefix")}icon-${i}`,
                        icon: menu.icon,
                        tintColor: ["lightGray", "systemLink"]
                    },
                    title: {
                        id: `${this.dataCenter.get("itemIdPrefix")}title-${i}`,
                        textColor: ["lightGray", "systemLink"]
                    }
                },
                icon: {
                    id: `${this.dataCenter.get("itemIdPrefix")}icon-${i}`,
                    image: $image(menu.icon[0]),
                    tintColor: $color("lightGray")
                },
                title: {
                    id: `${this.dataCenter.get("itemIdPrefix")}title-${i}`,
                    text: menu.title,
                    textColor: $color("lightGray")
                }
            }
            // 当前菜单
            if (this.selected === i) {
                menuTemplate.icon.image = $image(menu.icon[1])
                menuTemplate.icon.tintColor = $color("systemLink")
                menuTemplate.title.textColor = $color("systemLink")
            }
            views.push({
                type: "view",
                props: {
                    info: menuTemplate.info,
                    id: `${this.dataCenter.get("itemIdPrefix")}${i}`
                },
                views: [
                    {
                        type: "image",
                        props: Object.assign({
                            bgcolor: $color("clear")
                        }, menuTemplate.icon),
                        layout: (make, view) => {
                            make.centerX.equalTo(view.super)
                            make.size.equalTo(25)
                            make.top.inset(7)
                        }
                    },
                    {
                        type: "label",
                        props: Object.assign({
                            font: $font(10)
                        }, menuTemplate.title),
                        layout: (make, view) => {
                            make.centerX.equalTo(view.prev)
                            make.bottom.inset(5)
                        }
                    }
                ],
                layout: $layout.fill,
                events: Object.assign({
                    tapped: sender => {
                        if (this.selected === sender.info.index) return
                        // menu动画
                        $ui.animate({
                            duration: 0.4,
                            animation: () => {
                                // 点击的图标
                                const data = sender.info
                                const icon = $(data.icon.id)
                                icon.image = $image(data.icon.icon[1])
                                icon.tintColor = $color(data.icon.tintColor[1])
                                $(data.title.id).textColor = $color(data.title.textColor[1])
                            }
                        })
                        // 之前的图标
                        const data = $(`${this.dataCenter.get("itemIdPrefix")}${this.selected}`).info
                        const icon = $(data.icon.id)
                        icon.image = $image(data.icon.icon[0])
                        icon.tintColor = $color(data.icon.tintColor[0])
                        $(data.title.id).textColor = $color(data.title.textColor[0])
                        // 触发器
                        this.change(this.selected, sender.info.index)
                        // 更新selected值
                        this.selected = sender.info.index
                    }
                }, typeof menu.doubleTapped === "function" ? {
                    doubleTapped: () => menu.doubleTapped()
                } : {})
            })
        }
        return views
    }

    getView() {
        return {
            type: "view",
            props: { id: "easyjsbox-menu" },
            layout: (make, view) => {
                make.centerX.equalTo(view.super)
                make.width.equalTo(view.super)
                make.top.equalTo(view.super.safeAreaBottom).offset(-50)
                make.bottom.equalTo(view.super)
            },
            views: [
                {
                    type: "blur",
                    props: {
                        style: this.UIKit.blurStyle
                    },
                    layout: $layout.fill,
                    views: [{
                        type: "stack",
                        layout: $layout.fillSafeArea,
                        props: {
                            id: this.dataCenter.get("id"),
                            axis: $stackViewAxis.horizontal,
                            distribution: $stackViewDistribution.fillEqually,
                            spacing: 0,
                            stack: {
                                views: this.menuItemTemplate()
                            }
                        }
                    }]
                },
                {// 菜单栏上方灰色横线
                    type: "canvas",
                    layout: (make, view) => {
                        make.top.equalTo(view.prev.top)
                        make.height.equalTo(1 / $device.info.screen.scale)
                        make.left.right.inset(0)
                    },
                    events: {
                        draw: (view, ctx) => {
                            ctx.strokeColor = $color("gray")
                            ctx.setLineWidth(1 / $device.info.screen.scale)
                            ctx.moveToPoint(0, 0)
                            ctx.addLineToPoint(view.frame.width, 0)
                            ctx.strokePath()
                        }
                    }
                }
            ]
        }
    }
}

module.exports = { Controller, View, VERSION: "1.0.2" }