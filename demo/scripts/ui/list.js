const { NavigationView, SearchBar } = require("../libs/easy-jsbox")

class ListUI {
    constructor(kernel) {
        this.kernel = kernel
    }

    getPage() {
        // 初始化搜索条
        const searchBar = new SearchBar()
        searchBar.controller.setEvent("onChange", text => {
            $ui.toast(text)
        })
        // 初始化页面控制器
        const navigationView = new NavigationView()
        // 设置导航条元素
        navigationView.navigationBarTitle($l10n("LIST"))
        // pinTitleView() 方法将会始终保持 titleView 可见
        navigationView.navigationBarItems.setTitleView(searchBar).pinTitleView()
        navigationView.navigationBarItems.setLeftButtons([
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
        // 修改导航条背景色
        navigationView.navigationBar.setBackgroundColor($color("primarySurface"))
        // 添加视图
        navigationView.setView({
            type: "list",
            props: {
                data: ["Hello", "World"]
            },
            layout: $layout.fill
        })
        return navigationView.getPage()
    }
}

module.exports = ListUI
