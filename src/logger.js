/**
 * @typedef {import("./file-storage").FileStorage} FileStorage
 */

class Logger {
    static level = {
        info: "info",
        warn: "warn",
        error: "error"
    }

    writer
    fsLevels = [Logger.level.error]

    /**
     * @param {Array} levels
     */
    printToFile(levels) {
        this.fsLevels = levels
    }

    /**
     * @param {FileStorage} fs
     * @param {string} path
     */
    setWriter(fs, path) {
        this.writer = msg => {
            if (fs.exists(path)) {
                let old = fs.readSync(path)?.string ?? ""
                msg = old + msg
            }
            fs.writeSync(path, $data({ string: msg }))
        }
    }

    format(msg, level) {
        const time = new Date().toUTCString()
        return `${time} [${level.toUpperCase()}] ${msg}\n`
    }

    log(msg, level) {
        if (this.writer && this.fsLevels.includes(level)) {
            this.writer(this.format(msg, level))
        }
        // 控制台不格式化
        if ($app.isDebugging) console[level](msg)
    }
    info(msg) {
        this.log(msg, Logger.level.info)
    }
    warn(msg) {
        this.log(msg, Logger.level.warn)
    }
    error(msg) {
        this.log(msg, Logger.level.error)
    }
}

module.exports = {
    Logger
}
