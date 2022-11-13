class Request {
    static method = {
        get: "GET",
        post: "POST",
        delete: "DELETE",
        patch: "PATCH",
        head: "HEAD"
    }
    static cacheContainerKey = $addin.current.name + ".request.cache"
    static get cache() {
        return $cache.get(Request.cacheContainerKey) ?? {}
    }

    #useCache = false
    #ignoreCacheExp = false
    cacheLife = 1000 * 60 * 60 * 24 * 30 // ms
    isLogRequest = false
    timeout = 5

    logger

    /**
     *
     * @param {Function} logger
     */
    constructor(logger) {
        if (typeof logger === "function") {
            this.logger = logger
        }
    }

    #logRequest(message) {
        if (this.isLogRequest && typeof logger === "function") {
            this.logger(message)
        }
    }

    /**
     * 记录请求
     * @param {Function} logger
     * @returns
     */
    logRequest(logger) {
        this.isLogRequest = true
        if (typeof logger === "function") {
            this.logger = logger
        }
        return this
    }

    getCacheKey(url) {
        return $text.MD5(url)
    }

    getCache(key, _default = null) {
        const cache = Request.cache
        return cache[key] ?? _default
    }

    setCache(key, data) {
        if (!data || typeof data !== "string") {
            return
        }
        const cache = Request.cache
        cache[key] = data
        $cache.set(Request.cacheContainerKey, cache)
    }

    removeCache(key) {
        let cache = Request.cache
        delete cache[key]
        $cache.set(Request.cacheContainerKey, cache)
    }

    clearCache() {
        $cache.remove(Request.cacheContainerKey)
    }

    useCache() {
        this.#useCache = true
        return this
    }

    ignoreCacheExp() {
        this.#ignoreCacheExp = true
    }

    /**
     *
     * @param {string} path
     * @param {string} method
     * @param {object} body
     * @param {number} cacheLife ms
     * @returns
     */
    async request(url, method, body = {}, header = {}, cacheLife = this.cacheLife) {
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

        try {
            this.#logRequest(`sending request [${method}]: ${url}`)
            const resp = await $http.request({
                header,
                url,
                method,
                body,
                timeout: this.timeout
            })

            if (resp.error) {
                throw resp.error
            } else if (resp?.response?.statusCode >= 400) {
                let errMsg = resp.data
                if (typeof errMsg === "object") {
                    errMsg = JSON.stringify(errMsg)
                }
                throw new Error("http error: [" + resp.response.statusCode + "] " + errMsg)
            }

            if (useCache) {
                this.setCache(cacheKey, {
                    exp: Date.now() + cacheLife,
                    data: resp
                })
            }
            return resp
        } catch (error) {
            if (error.code) {
                error = new Error("network error: [" + error.code + "] " + error.localizedDescription)
            }
            throw error
        }
    }
}

module.exports = { Request }
