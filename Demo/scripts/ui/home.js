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
                        $ui.toast($l10n("HOME_PLUS_BUTTON_MESSAGE"))
                        // 一秒后播放完成动画
                        setTimeout(() => animate.done(), 1000)
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