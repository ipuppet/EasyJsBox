class Kernel {
    constructor() {
        this.path = {
            components: "./Components/"
        }
        this.components = {}
    }

    /**
     * 注册组件
     * @param {String} component 组件名
     */
    _registerComponent(component) {
        let View = require(`${this.path.components}${component}/view`)
        let Controller = require(`${this.path.components}${component}/controller`)
        let view = new View(this)
        let controller = new Controller(this)
        view.setController(controller)
        controller.setView(view)
        this.components[component] = {
            view: view,
            controller: controller
        }
        return this.components[component]
    }

    /**
     * 批量注册组件
     * @param {Array} components 包含组件名的数组
     */
    _registerComponents(components) {
        for (let component of components) {
            this._registerComponent(component)
        }
    }

    /**
     * 通过组件名获取已注册的组件
     * @param {String} component 组件名
     */
    getComponent(component) {
        return this.components[component]
    }

    /**
     * 渲染页面
     * @return {CallableFunction} 返回值为匿名函数，调用该函数开始渲染页面
     */
    render() {
        this._registerComponents([
            "Loading",
            "Menu",
            "Page"
        ])
        // 注入menu控制器
        this.components.Menu.controller.setCallback((from, to) => {
            $(`${this.components.Page.view.pageIdPrefix}${from}`).hidden = false
            $(`${this.components.Page.view.pageIdPrefix}${to}`).hidden = true
        })
        // 首页加载动画
        this.components.Loading.controller.start()
        return (menus, pages) => {
            this.components.Page.view.setPages(pages)
            this.components.Menu.view.setMenus(menus)
            $ui.render({
                type: "view",
                props: {
                    navBarHidden: true,
                    statusBarStyle: 0
                },
                layout: $layout.fill,
                views: [
                    this.components.Page.view.view(),
                    this.components.Menu.view.view()
                ],
                events: {
                    ready: () => {
                        this.components.Loading.controller.end()
                    },
                    layoutSubviews: () => {
                        if (!this.orientation) {
                            this.orientation = $device.info.screen.orientation
                            return
                        }
                        if (this.orientation !== $device.info.screen.orientation) {
                            this.orientation = $device.info.screen.orientation
                            // 更新菜单元素的布局
                            for (let i = 0; i < this.components.Menu.view.menus.length; i++) {
                                $(`${this.components.Menu.view.itemIdPrefix}${i}`).updateLayout(this.components.Menu.view.menuLayout.menuItem)
                            }
                            // 更新菜单栏
                            $(this.components.Menu.view.id).updateLayout(this.components.Menu.view.menuLayout.menuBar)
                        }
                    }
                }
            })
        }
    }
}

module.exports = Kernel