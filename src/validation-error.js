class ValidationError extends Error {
    constructor(parameter, type) {
        super(`The type of the parameter '${parameter}' must be '${type}'`)
        this.name = "ValidationError"
    }
}

module.exports = {
    ValidationError
}
