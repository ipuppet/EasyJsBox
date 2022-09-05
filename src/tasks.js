class Tasks {
    #tasks = {}

    /**
     *
     * @param {Function} task
     * @param {number} delay 单位 s
     * @returns
     */
    addTask(task, delay = 0) {
        const uuid = $text.uuid
        this.#tasks[uuid] = $delay(delay, async () => {
            await task()
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
