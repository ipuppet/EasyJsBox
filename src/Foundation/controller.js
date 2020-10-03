class BaseController {
    constructor(kernel) {
        this.kernel = kernel
    }

    setView(view) {
        this.view = view
    }
}

module.exports = BaseController