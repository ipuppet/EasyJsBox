const BaseController = require("../../Foundation/controller")

class Controller extends BaseController {
    start() {
        this.view.prepare()
    }

    end() {
        $(this.view.id).remove()
    }
}

module.exports = Controller