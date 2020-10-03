class DataCenter {
    constructor() {
        this.data = {}
    }
    set(key, value) {
        this.data[key] = value
    }

    get(key) {
        return this.data[key]
    }
}

module.exports = DataCenter