class Tasks {
    #syncDelay = 0
    #tasks = {}

    /**
     *
     * @param {Function} task
     * @param {number} delay 单位 s
     * @param {boolean} useSyncDelay 开启后相对上一个任务的延时添加延时 如 a,b 两个任务延时都为 0.1s, 则开启 SyncDelay 后 b 任务实际将会在 0.2s 后执行
     * @returns
     */
    addTask(task, delay = 0, useSyncDelay = false) {
        const uuid = $text.uuid
        this.#syncDelay += delay
        this.#tasks[uuid] = $delay(useSyncDelay ? this.#syncDelay : delay, async () => {
            await task()
            this.#syncDelay -= delay
            delete this.#tasks[uuid]
        })
        return uuid
    }

    cancelTask(id) {
        this.#tasks[id].cancel()
    }

    clearTasks() {
        Object.values(this.#tasks).forEach(task => task.cancel())
    }
}

module.exports = { Tasks }
