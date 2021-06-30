class HomeUI {
    constructor(kernel) {
        this.kernel = kernel
    }

    getView() {
        return [{
            type: "text",
            props: {
                editable: false,
                text: "Hello World!"
            },
            layout: $layout.fill
        }]
    }
}

module.exports = HomeUI