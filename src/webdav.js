const { Request } = require("./request")

class WebDAV extends Request {
    /**
     * @type {string}
     */
    #host
    user
    password
    /**
     * @type {string}
     */
    #basepath

    namespace = "JSBox.WebDAV"
    lockTokenCacheKey = this.namespace + ".lockToken"

    get host() {
        return this.#host
    }
    set host(host) {
        this.#host = host.trim()
        while (this.#host.endsWith("/")) {
            this.#host = this.#host.substring(0, this.#host.length - 1)
        }
        if (!this.#host.startsWith("http")) {
            this.#host = "http://" + this.#host
        }
    }
    get basepath() {
        return this.#basepath
    }
    set basepath(basepath) {
        this.#basepath = basepath.trim()
        while (this.#basepath.endsWith("/")) {
            this.#basepath = this.#basepath.substring(0, this.#basepath.length - 1)
        }
        while (this.#basepath.startsWith("/")) {
            this.#basepath = this.#basepath.substring(1)
        }
        this.#basepath = "/" + this.#basepath
    }

    constructor({ host, user, password, basepath = "" } = {}) {
        super()

        this.host = host
        this.user = user
        this.password = password
        this.basepath = basepath
    }

    #getPath(path) {
        path = path.trim()
        path = path.startsWith("/") ? path : "/" + path
        return this.basepath + path
    }

    /**
     *
     * @param {string} path
     * @param {string} method
     * @param {object} body
     * @param {object} header
     * @returns
     */
    async request(path, method, body = null, header = {}) {
        header = Object.assign(
            {
                "Content-Type": "text/xml; charset=UTF-8",
                Authorization: "Basic " + $text.base64Encode(`${this.user}:${this.password}`)
            },
            header
        )
        return await super.request(this.host + this.#getPath(path), method, body, header)
    }

    /**
     *
     * @returns {[string]}
     */
    async allow(path) {
        const resp = await this.request(path, Request.method.options)
        const allow = resp.response.headers?.allow ?? resp.response.headers?.Allow
        return allow?.split(",").map(item => item.trim().toUpperCase()) ?? []
    }

    async propfind(path, props = [], depth = 0) {
        if (!Array.isArray(props)) {
            props = [props]
        }
        const propString = props.map(prop => `<D:${prop}/>`).join()
        const body = `<?xml version="1.0" encoding="utf-8" ?><D:propfind xmlns:D="DAV:"><D:prop>${propString}</D:prop></D:propfind>`
        const resp = await this.request(path, "PROPFIND", body, { Depth: depth })
        return $xml.parse({ string: resp.data })
    }
    async propfindAll(path, depth = 0) {
        const body = `<?xml version="1.0" encoding="utf-8" ?><D:propfind xmlns:D="DAV:"><D:allprop/></D:propfind>`
        const resp = await this.request(path, "PROPFIND", body, { Depth: depth })
        return $xml.parse({ string: resp.data })
    }

    async ls(path, depth = 1) {
        const resp = await this.request(path, "PROPFIND", null, { Depth: depth })
        return $xml.parse({ string: resp.data })
    }

    /**
     *
     * @returns {boolean}
     */
    async exists(path) {
        try {
            const allow = await this.allow(path)
            if (allow.includes(Request.method.get)) {
                await this.request(path, Request.method.head)
            } else {
                await this.ls(path, 0)
            }
            return true
        } catch (error) {
            if (error?.code === 404) {
                return false
            }
            throw error
        }
    }

    async mkdir(path) {
        return await this.request(path, "MKCOL")
    }

    async get(path) {
        return await this.request(path, Request.method.get, null)
    }

    async put(path, body, { withLock = true, waitInterval = 2, maxTry = 3 } = {}) {
        let header = {}
        while (true) {
            let fileLock = await this.isLocked(path)
            if (!fileLock) {
                break
            }
            if (--maxTry <= 0) {
                throw new Error("Resource Locked")
            }
            await $wait(waitInterval)
        }

        if (withLock) {
            try {
                await this.lock(path)
                header["If"] = `(${this.#getLockToken(path)})`
            } catch (error) {
                if (error.code !== 404) {
                    throw error
                }
                withLock = false // 跳过解锁步骤
            }
        }

        await this.request(path, Request.method.put, body, header)

        if (withLock) await this.unlock(path)
    }

    async delete(path) {
        if (!path) {
            throw new Error("path empty")
        }
        return await this.request(path, Request.method.delete)
    }

    #setLockToken(path, token) {
        const lockToken = $cache.get(this.lockTokenCacheKey) ?? {}
        lockToken[path] = token
        $cache.set(this.lockTokenCacheKey, lockToken)
    }
    #getLockToken(path) {
        const lockToken = $cache.get(this.lockTokenCacheKey) ?? {}
        return lockToken[path]
    }
    async isSupportLock(path) {
        try {
            const resp = await this.propfind(path, "supportedlock")
            const rootElement = resp.rootElement
            const lockentry = rootElement.firstChild({
                xPath: "//D:response/D:propstat/D:prop/D:supportedlock/D:lockentry"
            })
            const write = lockentry.firstChild({ xPath: "//D:locktype/D:write" })
            return write ? true : false
        } catch (error) {
            if (error.code !== 404) {
                return false
            } else {
                throw error
            }
        }
    }
    async lock(path, { infinity = false, timeout = "Second-10" } = {}) {
        const isSupportLock = await this.isSupportLock(path)
        if (!isSupportLock) {
            throw new Error("Your WebDAV service does not support the `LOCK` method.")
        }

        const body = `<?xml version="1.0" encoding="utf-8" ?><D:lockinfo xmlns:D='DAV:'><D:lockscope><D:exclusive/></D:lockscope><D:locktype><D:write/></D:locktype><D:owner><D:href>${this.namespace}</D:href></D:owner></D:lockinfo>`
        const resp = await this.request(path, "LOCK", body, {
            Timeout: timeout,
            Depth: infinity ? "infinity" : 0
        })
        const token = resp.response.headers["lock-token"] ?? resp.response.headers["Lock-Token"]
        this.#setLockToken(path, token)
        return $xml.parse({ string: resp.data })
    }
    async isLocked(path) {
        try {
            const resp = await this.propfind(path, "lockdiscovery")
            const rootElement = resp.rootElement
            const status = rootElement.firstChild({
                xPath: "//D:response/D:propstat/D:status"
            }).string
            const supported = !status.includes("404")
            if (supported) {
                // TODO lockdiscovery
                const lockdiscovery = rootElement.firstChild({
                    xPath: "//D:response/D:propstat/D:prop/D:lockdiscovery"
                })
                const activelocks = lockdiscovery.children() ?? []
                for (let i = 0; i < activelocks.length; i++) {
                    const lockroot = activelocks[i].firstChild({ tag: "lockroot" }).string
                    if (lockroot === this.host + this.#getPath(path)) {
                        return true
                    }
                }
            } else {
                // unsupport lockdiscovery
                await this.lock(path, { timeout: "Second-0" })
            }
        } catch (error) {
            if (error.code === 423) {
                return true
            }
        }
        return false
    }
    async refreshLock(path, { infinity = false, timeout = "Second-10" } = {}) {
        const resp = await this.request(path, "LOCK", null, {
            Timeout: timeout,
            If: this.#getLockToken(path),
            Depth: infinity ? "infinity" : 0
        })
        return $xml.parse({ string: resp.data })
    }
    async unlock(path) {
        await this.request(path, "UNLOCK", null, {
            "Lock-Token": this.#getLockToken(path)
        })
    }
}

module.exports = { WebDAV }
