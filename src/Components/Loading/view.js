const UIBase = require("../../Foundation/ui-base")

class View extends UIBase {
    constructor(controller) {
        this.controller = controller
        this.id = "base-ui-prepare"
    }

    /**
     * 加载动画
     */
    prepare() {
        $ui.render({
            props: {
                navBarHidden: true,
                statusBarStyle: 0
            },
            views: [{
                type: "view",
                props: {
                    id: this.id
                },
                views: [{
                    type: "spinner",
                    props: {
                        loading: true
                    },
                    layout: (make, view) => {
                        make.center.equalTo(view.super)
                    }
                }],
                layout: $layout.fill
            }]
        })
    }
}

module.exports = View