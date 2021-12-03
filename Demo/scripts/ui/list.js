const {
    PageController,
    SearchBar
} = require("../easy-jsbox")

class ListUI {
    constructor(kernel) {
        this.kernel = kernel
    }

    getPageView() {
        // 初始化搜索条
        const searchBar = new SearchBar()
        searchBar.controller.setEvent("onChange", text => {
            $ui.toast(text)
        })
        // 初始化页面控制器
        const pageController = new PageController()
        // 设置导航条元素
        pageController.navigationItem
            .setTitle($l10n("LIST"))
            .setTitleView(searchBar)
        // 修改导航条背景色
        pageController.navigationController.navigationBar.setBackgroundColor($color("primarySurface"))
        // 添加视图
        pageController.setView({
            type: "list",
            props: {
                data: ["Hello", "World"]
            },
            layout: $layout.fill
        })
        return pageController.getPage()
    }
}

module.exports = ListUI