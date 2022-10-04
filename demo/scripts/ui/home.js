const { NavigationView, NavigationBar } = require("../libs/easy-jsbox")

class HomeUI {
    constructor(kernel) {
        this.kernel = kernel
    }

    getPage() {
        // 初始化页面控制器
        const navigationView = new NavigationView()
        // 设置导航条元素
        navigationView.navigationBarTitle($l10n("HOME"))
        navigationView.navigationBar.setLargeTitleDisplayMode(NavigationBar.LargeTitleDisplayModeAlways) // 一直显示大标题
        navigationView.navigationBarItems.setRightButtons([
            {
                symbol: "plus.circle",
                tapped: animate => {
                    animate.start()
                    $ui.alert({
                        title: $l10n("HOME_PLUS_BUTTON_MESSAGE"),
                        actions: [
                            {
                                title: "OK",
                                handler: () => {
                                    animate.done()
                                }
                            },
                            {
                                title: "Cancel",
                                handler: () => {
                                    animate.cancel()
                                }
                            }
                        ]
                    })
                }
            }
        ])
        // 添加视图
        navigationView.setView({
            type: "markdown",
            props: {
                content: `## ${$l10n("HELLO_WORLD")}`
            },
            layout: $layout.fill
        })
        return navigationView.getPage()
    }
}

module.exports = HomeUI
