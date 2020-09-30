const Controller = require("./controller")
const View = require("./view")

let controller = new Controller()
let view = new View(controller)

module.exports = {
    controller: controller,
    view: view,
    run: (menus) => {
        view.setMenus(menus)
        return view.view()
    }
}