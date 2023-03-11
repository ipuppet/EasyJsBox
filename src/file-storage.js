class FileStorageParameterError extends Error {
    constructor(parameter) {
        super(`Parameter [${parameter}] is required.`)
        this.name = "FileStorageParameterError"
    }
}

class FileStorageFileNotFoundError extends Error {
    constructor(filePath) {
        super(`File not found: ${filePath}`)
        this.name = "FileStorageFileNotFoundError"
    }
}

class FileStorage {
    basePath

    constructor({ basePath = "storage" } = {}) {
        this.basePath = basePath
        this.#createDirectory(this.basePath)
    }

    static join(...path) {
        const length = path.length
        let result = path[0]
        if (length < 2) return result

        for (let i = 0; i < length - 1; ++i) {
            let p = path[i + 1]
            if (p.startsWith("/")) {
                p = p.substring(1)
            }
            result = result.endsWith("/") ? result + p : result + "/" + p
        }

        return result
    }

    #createDirectory(path) {
        if (!$file.isDirectory(path)) {
            $file.mkdir(path)
        }
    }

    filePath(path = "", createPath = true) {
        path = FileStorage.join(this.basePath, path)

        let fileName = ""

        if (!path.endsWith("/")) {
            const lastSlash = path.lastIndexOf("/")
            const lastPoint = path.lastIndexOf(".")
            if (lastPoint > lastSlash) {
                fileName = path.substring(lastSlash + 1)
                path = path.substring(0, lastSlash + 1)
            }
        }

        if (createPath) {
            this.#createDirectory(path)
        }

        return path + fileName
    }

    exists(path = "") {
        path = this.filePath(path, false)

        if ($file.exists(path)) {
            return true
        }

        return false
    }

    write(path = "", data) {
        return new Promise((resolve, reject) => {
            try {
                const success = this.writeSync(path, data)
                if (success) {
                    resolve(success)
                } else {
                    reject(success)
                }
            } catch (error) {
                reject(error)
            }
        })
    }

    writeSync(path = "", data) {
        if (!data) {
            throw new FileStorageParameterError("data")
        }
        return $file.write({
            data: data,
            path: this.filePath(path)
        })
    }

    read(path = "") {
        return new Promise((resolve, reject) => {
            try {
                const file = this.readSync(path)
                if (file) {
                    resolve(file)
                } else {
                    reject()
                }
            } catch (error) {
                reject(error)
            }
        })
    }

    readSync(path = "") {
        path = this.filePath(path)
        if (!$file.exists(path)) {
            throw new FileStorageFileNotFoundError(path)
        }
        if ($file.isDirectory(path)) {
            return $file.list(path)
        }
        return $file.read(path)
    }

    readAsJSON(path = "", _default = null) {
        try {
            const fileString = this.readSync(path)?.string
            return JSON.parse(fileString)
        } catch (error) {
            return _default
        }
    }

    static readFromRoot(path = "") {
        return new Promise((resolve, reject) => {
            try {
                const file = FileStorage.readFromRootSync(path)
                if (file) {
                    resolve(file)
                } else {
                    reject()
                }
            } catch (error) {
                reject(error)
            }
        })
    }

    static readFromRootSync(path = "") {
        if (!path) {
            throw new FileStorageParameterError("path")
        }
        if (!$file.exists(path)) {
            throw new FileStorageFileNotFoundError(path)
        }
        if ($file.isDirectory(path)) {
            return $file.list(path)
        }
        return $file.read(path)
    }

    static readFromRootAsJSON(path = "", _default = null) {
        try {
            const fileString = FileStorage.readFromRootSync(path)?.string
            return JSON.parse(fileString)
        } catch (error) {
            return _default
        }
    }

    delete(path = "") {
        return $file.delete(this.filePath(path, false))
    }

    copy(from, to) {
        from = this.filePath(from)
        to = this.filePath(to)
        $file.copy({ src: from, dst: to })
    }

    move(from, to) {
        from = this.filePath(from)
        to = this.filePath(to)
        $file.move({ src: from, dst: to })
    }
}

module.exports = {
    FileStorageParameterError,
    FileStorageFileNotFoundError,
    FileStorage
}
