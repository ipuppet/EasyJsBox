class BaseController {
    constructor(kernel) {
        this.kernel = kernel
    }

    init() { }

    setView(view) {
        this.view = view
    }

    setDataCenter(dataCenter) {
        this.dataCenter = dataCenter
    }
}

module.exports = BaseController