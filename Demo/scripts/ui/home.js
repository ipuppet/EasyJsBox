const {
    PageController,
    NavigationItem
} = require("../easy-jsbox")

class HomeUI {
    constructor(kernel) {
        this.kernel = kernel
    }

    getPageView() {
        // 初始化页面控制器
        const pageController = new PageController()
        // 设置导航条元素
        pageController.navigationItem
            .setTitle($l10n("HOME"))
            .setLargeTitleDisplayMode(NavigationItem.LargeTitleDisplayModeAlways) // 一直显示大标题
            .setRightButtons([
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
        pageController.setView({
            type: "markdown",
            props: {
                content: `## ${$l10n("HELLO_WORLD")}`
            },
            layout: $layout.fill
        })
        return pageController.getPage()
    }
}

module.exports = HomeUI