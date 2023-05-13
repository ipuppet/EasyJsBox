const { FileStorage } = require("./file-storage")

class Logger {
    print

    constructor(print) {
        this.print = print ?? console.log
    }

    /**
     *
     * @param {FileStorage} fs
     * @param {string} path
     */
    printToFile(fs, path) {
        this.print = msg => {
            if (fs.exists(path)) {
                let old = fs.readSync(path)?.string ?? ""
                msg = old + msg
            }
            fs.writeSync(path, $data({ string: msg }))
        }
    }

    log(msg, level) {
        const time = new Date().toUTCString()
        const logStr = `${time} [${level}] ${msg}\n`
        this.print(logStr)
    }

    info(msg) {
        this.log(msg, "INFO")
    }
    error(msg) {
        this.log(msg, "ERROR")
    }
    alert(msg) {
        this.log(msg, "ALERT")
    }
}

module.exports = {
    Logger
}
