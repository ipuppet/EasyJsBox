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

    getView() {
        return this.view.getView()
    }

    setDataCenter(dataCenter) {
        this.dataCenter = dataCenter
    }
}

module.exports = BaseController