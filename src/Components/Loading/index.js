const Controller = require("./controller")
const View = require("./view")

let controller = new Controller()
let view = new View(controller)

module.exports = {
    start: () => { view.prepare() },
    end: () => { $(view.id).remove() }
}