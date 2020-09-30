const Controller = require("./controller")
const View = require("./view")

let controller = new Controller()
let view = new View(controller)

module.exports = {
    controller: controller,
    view: view,
    run: (views) => {
        view.setViews(views)
        return view.view()
    }
}