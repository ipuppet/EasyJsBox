class Controller {
    constructor(data) {
        Object.assign(this, data)
    }

    start() {
        this.view.prepare()
    }

    end() {
        $(this.dataCenter.get("id")).remove()
    }
}

class View {
    constructor(data) {
        Object.assign(this, data)
        this.dataCenter.set("id", "base-ui-prepare")
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
                    id: this.dataCenter.get("id")
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

module.exports = { Controller, View }