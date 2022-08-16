const { View } = require("./view")
const { UIKit } = require("./ui-kit")

class FixedFooterView extends View {
    height = 60

    getView() {
        this.type = "view"
        this.setProp("bgcolor", UIKit.primaryViewBackgroundColor)
        this.layout = (make, view) => {
            make.left.right.bottom.equalTo(view.super)
            make.top.equalTo(view.super.safeAreaBottom).offset(-this.height)
        }

        this.views = [
            View.create({
                props: this.props,
                views: this.views,
                layout: (make, view) => {
                    make.left.right.top.equalTo(view.super)
                    make.height.equalTo(this.height)
                }
            })
        ]

        return this
    }
}

module.exports = {
    FixedFooterView
}
