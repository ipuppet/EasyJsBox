class Plist {
    constructor(content) {
        this.content = content
    }

    valueToJs(xml) {
        switch (xml.tag) {
            case "dict":
                return this.dictToJs(xml)
            case "true":
            case "false":
                return xml.tag === "true"
            case "integer":
                return xml.number
            case "key":
            case "string":
                return xml.string
            case "array":
                return xml.children().map(i => i.tag)
            default:
                return xml.node
        }
    }

    arrayToJs(xml) {
        const arr = []
        xml.children().forEach(item => {
            arr.push(this.valueToJs(item))
        })

        return arr
    }

    dictToJs(xml) {
        const keys = [],
            values = []
        xml.children().forEach(item => {
            if (item.tag === "key") {
                keys.push(this.valueToJs(item))
            } else {
                values.push(this.valueToJs(item))
            }
        })

        return Object.fromEntries(keys.map((key, i) => [key, values[i]]))
    }

    getObject() {
        if (!this.content) {
            return false
        }
        const xml = $xml.parse({ string: this.content, mode: "xml" })
        return this.valueToJs(
            xml.rootElement.firstChild({
                xPath: "//plist/dict"
            })
        )
    }

    static get(content) {
        const plist = new this(content)
        return plist.getObject()
    }
}

module.exports = {
    Plist
}
