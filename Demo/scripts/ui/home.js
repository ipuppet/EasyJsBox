class HomeUI {
    constructor(kernel) {
        this.kernel = kernel
    }

    getView() {
        return [{
            type: "text",
            props: {
                editable: false,
                text: $l10n("HELLO_WORLD")
            },
            layout: $layout.fill
        }]
    }
}

module.exports = HomeUI