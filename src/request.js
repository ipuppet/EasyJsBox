const { Logger } = require("./logger")

class RequestError extends Error {
    constructor({ message, code, type } = {}) {
        super(message)
        this.name = "RequestError"
        this.code = code
        this.type = type
    }
}

class Request {
    static method = {
        get: "GET",
        post: "POST",
        put: "PUT",
        delete: "DELETE",
        patch: "PATCH",
        head: "HEAD",
        options: "OPTIONS"
    }
    static errorType = {
        http: 0,
        network: 1
    }

    cacheContainerKey = $addin?.current?.name + ".request.cache"

    #sharedURLCache
    #useCache = false
    #ignoreCacheExp = false
    cacheLife = 1000 * 60 * 60 * 24 * 30 // ms
    #isLogRequest = false
    timeout = 5

    /**
     * @type {Logger}
     */
    logger

    /**
     *
     * @param {Logger} logger
     */
    constructor(logger) {
        if (logger instanceof Logger) {
            this.logger = logger
        }
    }

    get cache() {
        return $cache.get(this.cacheContainerKey) ?? {}
    }

    #logRequest(message) {
        if (this.#isLogRequest && this.logger instanceof Logger) {
            this.logger.info(message)
        }
    }

    /**
     * 记录请求
     */
    logRequest() {
        this.#isLogRequest = true
        return this
    }

    disableLogRequest() {
        this.#isLogRequest = false
    }

    getCacheKey(url) {
        return $text.MD5(url)
    }

    getCache(key, _default = null) {
        const cache = this.cache
        return cache[key] ?? _default
    }

    setCache(key, data) {
        if (!data) {
            return
        }
        const cache = this.cache
        cache[key] = data
        $cache.set(this.cacheContainerKey, cache)
    }

    removeCache(key) {
        let cache = this.cache
        delete cache[key]
        $cache.set(this.cacheContainerKey, cache)
    }

    clearCache() {
        $cache.remove(this.cacheContainerKey)
    }

    clearNSURLCache() {
        if (!this.#sharedURLCache) {
            this.#sharedURLCache = $objc("NSURLCache").$sharedURLCache()
        }
        this.#sharedURLCache.$removeAllCachedResponses()
    }

    enableCache() {
        this.#useCache = true
        return this
    }
    disableCache() {
        this.#useCache = false
        return this
    }

    ignoreCacheExp() {
        this.#ignoreCacheExp = true
    }

    /**
     *
     * @param {string} url
     * @param {string} method
     * @param {object} body
     * @param {object} header
     * @param {number} cacheLife ms
     * @returns
     */
    async request(url, method, body = {}, header = {}, cacheLife = this.cacheLife, opts) {
        let cacheKey
        const useCache = this.#useCache && method === Request.method.get
        if (useCache) {
            cacheKey = this.getCacheKey(url)
            const cache = this.getCache(cacheKey)
            if (cache && (this.#ignoreCacheExp || cache.exp > Date.now())) {
                this.#logRequest("get data from cache: " + url)
                return cache.data
            }
        }

        this.#logRequest(`sending request [${method}]: ${url}`)
        const resp = await $http.request(
            Object.assign(
                {
                    header,
                    url,
                    method,
                    body: method === Request.method.get ? null : body,
                    timeout: this.timeout
                },
                opts
            )
        )

        if (resp.error) {
            throw new RequestError({
                type: Request.errorType.network,
                message: resp.error.localizedDescription,
                code: resp.error.code
            })
        } else if (resp?.response?.statusCode >= 400) {
            let errMsg = resp.data
            if (typeof errMsg === "object") {
                errMsg = JSON.stringify(errMsg)
            }
            throw new RequestError({
                type: Request.errorType.http,
                message: errMsg,
                code: resp.response.statusCode
            })
        }

        if (useCache) {
            this.setCache(cacheKey, {
                exp: Date.now() + cacheLife,
                data: resp
            })
        }
        return resp
    }
}

module.exports = { Request }
