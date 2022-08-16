class UILoading {
    #labelId
    text = ""
    interval
    fullScreen = false
    #loop = () => {}

    constructor() {
        this.#labelId = $text.uuid
    }

    updateText(text) {
        $(this.#labelId).text = text
    }

    setLoop(loop) {
        if (typeof loop !== "function") {
            throw "loop must be a function"
        }
        this.#loop = loop
    }

    done() {
        clearInterval(this.interval)
    }

    load() {
        $ui.render({
            props: {
                navBarHidden: this.fullScreen
            },
            views: [
                {
                    type: "spinner",
                    props: {
                        loading: true
                    },
                    layout: (make, view) => {
                        make.centerY.equalTo(view.super).offset(-15)
                        make.width.equalTo(view.super)
                    }
                },
                {
                    type: "label",
                    props: {
                        id: this.#labelId,
                        align: $align.center,
                        text: ""
                    },
                    layout: (make, view) => {
                        make.top.equalTo(view.prev.bottom).offset(10)
                        make.left.right.equalTo(view.super)
                    }
                }
            ],
            layout: $layout.fill,
            events: {
                appeared: () => {
                    this.interval = setInterval(() => {
                        this.#loop()
                    }, 100)
                }
            }
        })
    }
}

module.exports = {
    UILoading
}
