const { Controller } = require("../controller")

/**
 * @typedef {import("./navigation-view").NavigationView} NavigationView
 */

/**
 * @property {function(NavigationView)} ViewController.events.onChange
 */
class ViewController extends Controller {
    /**
     * @type {NavigationView[]}
     */
    #navigationViews = []

    /**
     * @param {NavigationView} navigationView
     */
    #onPop(navigationView) {
        this.callEvent("onPop", navigationView) // 被弹出的对象
        this.#navigationViews.pop()
    }

    /**
     * push 新页面
     * @param {NavigationView} navigationView
     */
    push(navigationView) {
        const parent = this.#navigationViews[this.#navigationViews.length - 1]
        navigationView.navigationBarItems.addPopButton(parent?.navigationBar.title)
        this.#navigationViews.push(navigationView)
        $ui.push({
            props: {
                statusBarStyle: 0,
                navBarHidden: true
            },
            events: {
                dealloc: () => {
                    this.#onPop(navigationView)
                }
            },
            views: [navigationView.getPage().definition],
            layout: $layout.fill
        })
    }
}

module.exports = {
    ViewController
}
