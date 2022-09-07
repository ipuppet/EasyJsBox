/**
 * @typedef {import("./kernel").Kernel} Kernel
 */

class Request {
    static Method = {
        get: "GET",
        post: "POST"
    }
    #baseUrlMd5
    #useCache = false
    #ignoreCacheExp = false
    cacheLife = 1000 * 60 * 60 * 24 * 30 // ms
    /**
     * @type {Kernel}
     */
    kernel

    /**
     *
     * @param {Kernel} kernel
     */
    constructor(kernel) {
        this.kernel = kernel
    }

    getCacheKey(path) {
        if (!this.#baseUrlMd5) {
            this.#baseUrlMd5 = $text.MD5(this.baseUrl)
        }
        return this.#baseUrlMd5 + $text.MD5(path)
    }

    setCache(cacheKey, data) {
        $cache.set(cacheKey, data)
    }

    getCache(cacheKey, _default = null) {
        return $cache.get(cacheKey) ?? _default
    }

    removeCache(cacheKey) {
        $cache.remove(cacheKey)
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
    async request(path, method, body = {}, cacheLife = this.cacheLife) {
        const url = this.baseUrl + path

        let cacheKey
        const useCache = this.#useCache && method === Request.Method.get
        if (useCache) {
            cacheKey = this.getCacheKey(path)
            const cache = this.getCache(cacheKey)
            if (cache && (this.#ignoreCacheExp || cache.exp > Date.now())) {
                this.kernel.print("get data from cache: " + url)
                return cache.data
            }
        }

        try {
            if (useCache) {
                this.kernel.print("sending request: " + url)
            }
            const resp = await $http.request({
                url,
                method,
                body
            })
            if (resp?.response?.statusCode >= 400) {
                let errMsg = resp.data
                if (typeof errMsg === "object") {
                    errMsg = JSON.stringify(errMsg)
                }
                throw new Error("http error: [" + resp.response.statusCode + "] " + errMsg)
            }
            if (useCache) {
                this.setCache(cacheKey, {
                    exp: Date.now() + cacheLife,
                    data: resp.data
                })
            }
            return resp.data
        } catch (error) {
            if (error.code) {
                error = new Error("network error: [" + error.code + "] " + error.localizedDescription)
            }
            throw error
        }
    }
}

module.exports = { Request }
