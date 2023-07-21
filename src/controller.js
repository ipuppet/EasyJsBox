class Controller {
    events = {}

    setEvents(events) {
        Object.keys(events).forEach(event => this.setEvent(event, events[event]))
        return this
    }

    setEvent(event, callback) {
        this.events[event] = callback
        return this
    }

    appendEvent(event, callback) {
        const old = this.events[event]
        if (typeof old === "function") {
            this.events[event] = (...args) => {
                old(...args)
                callback(...args)
            }
        } else {
            this.setEvent(event, callback)
        }

        return this
    }

    callEvent(event, ...args) {
        if (typeof this.events[event] === "function") {
            this.events[event](...args)
        }
    }
}

module.exports = {
    Controller
}
