const Loading = require("./Components/Loading/index")
const Menu = require("./Components/BottomMenu/index")
const Page = require("./Components/Page/index")

// 注入menu控制器
Menu.controller.setCallback((from, to) => {
    $(`${Page.view.pageIdPrefix}${from}`).hidden = false
    $(`${Page.view.pageIdPrefix}${to}`).hidden = true
})

class Kernel {
    constructor() {
        // 首页加载动画
        Loading.start()
    }

    /**
     * 渲染页面
     */
    render() {
        Loading.end()
        $ui.render({
            type: "view",
            props: {
                navBarHidden: true,
                statusBarStyle: 0
            },
            layout: $layout.fill,
            views: [
                Page.run(),
                Menu.run()
            ],
            events: {
                layoutSubviews: () => {
                    if (!this.orientation) {
                        this.orientation = $device.info.screen.orientation
                        return
                    }
                    if (this.orientation !== $device.info.screen.orientation) {
                        this.orientation = $device.info.screen.orientation
                        // 更新菜单元素的布局
                        for (let i = 0; i < this.menus.length; i++) {
                            $(`${Menu.view.itemIdPrefix}${i}`).updateLayout(Menu.view.menuLayout.menuItem)
                        }
                        // 更新菜单栏
                        $(Menu.view.id).updateLayout(Menu.view.menuLayout.menuBar)
                    }
                }
            }
        })
    }
}

module.exports = Kernel