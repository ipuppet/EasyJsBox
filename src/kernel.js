const VERSION = "1.0.0"

const DataCenter = require("./Foundation/data-center")

class Kernel {
    constructor() {
        this.path = {
            components: "./Components/"
        }
        this.components = {}
        this.plugins = {}
    }

    /**
     * 注册组件
     * @param {String} component 组件名
     */
    _registerComponent(component) {
        let View = require(`${this.path.components}${component}/view`)
        let Controller = require(`${this.path.components}${component}/controller`)
        // 新实例
        let view = new View(this)
        let controller = new Controller(this)
        // 相互注入
        view.setController(controller)
        controller.setView(view)
        // 加载数据中心
        let dataCenter = new DataCenter()
        view.setDataCenter(dataCenter)
        controller.setDataCenter(dataCenter)
        // 初始化
        view.init()
        controller.init()
        // 注册到kernel
        this.components[component] = {
            view: view,
            controller: controller,
            dataCenter: dataCenter
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
     * 注册组件
     * @param {String} plugin 
     */
    registerPlugin(plugin) {
        let { Plugin, VERSION } = require(`./Plugins/${plugin}`)
        this.plugins[plugin] = {
            plugin: Plugin,
            version: VERSION
        }
        return this.plugins[plugin].plugin
    }

    /**
     * 批量注册组件
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
        this._registerComponents([
            "Loading",
            "Menu",
            "Page"
        ])
        // 注入menu控制器
        this.components.Menu.controller.setCallback((from, to) => {
            $(`${this.components.Page.dataCenter.get("pageIdPrefix")}${from}`).hidden = true
            $(`${this.components.Page.dataCenter.get("pageIdPrefix")}${to}`).hidden = false
        })
        // 首页加载动画
        this.components.Loading.controller.start()
        // 注入页面和菜单
        this.components.Page.controller.setPages(pages)
        this.components.Menu.controller.setMenus(menus)
        return () => {
            $ui.render({
                type: "view",
                props: {
                    navBarHidden: true,
                    statusBarStyle: 0
                },
                layout: $layout.fill,
                views: [
                    this.components.Page.view.getView(),
                    this.components.Menu.view.getView()
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

module.exports = {
    Kernel: Kernel,
    VERSION: VERSION
}