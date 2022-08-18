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

    #createDirectory(path) {
        if (!$file.isDirectory(path)) {
            $file.mkdir(path)
        }
    }

    #filePath(path = "", fileName) {
        path = `${this.basePath}/${path.trim("/")}`.trim("/")

        this.#createDirectory(path)

        path = `${path}/${fileName}`
        return path
    }

    write(path = "", fileName, data) {
        if (!fileName) {
            throw new FileStorageParameterError("fileName")
        }
        if (!data) {
            throw new FileStorageParameterError("data")
        }
        return $file.write({
            data: data,
            path: this.#filePath(path, fileName)
        })
    }

    writeSync(path = "", fileName, data) {
        return new Promise((resolve, reject) => {
            try {
                const success = this.write(path, fileName, data)
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

    exists(path = "", fileName) {
        if (!fileName) {
            throw new FileStorageParameterError("fileName")
        }
        path = this.#filePath(path, fileName)

        if ($file.exists(path)) {
            return path
        }

        return false
    }

    read(path = "", fileName) {
        if (!fileName) {
            throw new FileStorageParameterError("fileName")
        }
        path = this.#filePath(path, fileName)
        if (!$file.exists(path)) {
            throw new FileStorageFileNotFoundError(path)
        }
        if ($file.isDirectory(path)) {
            return $file.list(path)
        }
        return $file.read(path)
    }

    readSync(path = "", fileName) {
        return new Promise((resolve, reject) => {
            try {
                const file = this.read(path, fileName)
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

    readAsJSON(path = "", fileName, _default = null) {
        try {
            const fileString = this.read(path, fileName)?.string
            return JSON.parse(fileString)
        } catch (error) {
            return _default
        }
    }

    static readFromRoot(path) {
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

    static readFromRootSync(path = "") {
        return new Promise((resolve, reject) => {
            try {
                const file = FileStorage.readFromRoot(path)
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

    static readFromRootAsJSON(path = "", _default = null) {
        try {
            const fileString = FileStorage.readFromRoot(path)?.string
            return JSON.parse(fileString)
        } catch (error) {
            return _default
        }
    }

    delete(path = "", fileName = "") {
        return $file.delete(this.#filePath(path, fileName))
    }
}

module.exports = {
    FileStorageParameterError,
    FileStorageFileNotFoundError,
    FileStorage
}
