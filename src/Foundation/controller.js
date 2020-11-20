class BaseController {
    constructor(kernel) {
        this.kernel = kernel
    }

    init(args) {
        this.args = args
    }

    setView(view) {
        this.view = view
    }

    setDataCenter(dataCenter) {
        this.dataCenter = dataCenter
    }
}

module.exports = BaseController