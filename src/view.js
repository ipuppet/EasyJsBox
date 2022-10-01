const { UIKit } = require("./ui-kit")

/**
 * 视图基类
 */
class View {
    /**
     * id
     * @type {string}
     */
    id = $text.uuid

    /**
     * 类型
     * @type {string}
     */
    type

    /**
     * 属性
     * @type {Object}
     */
    props

    /**
     * 子视图
     * @type {Array}
     */
    views

    /**
     * 事件
     * @type {Object}
     */
    events

    /**
     * 布局函数
     * @type {Function}
     */
    layout

    constructor({ type = "view", props = {}, views = [], events = {}, layout = $layout.fill } = {}) {
        // 属性
        this.type = type
        this.props = props
        this.views = views
        this.events = events
        this.layout = layout

        if (this.props.id) {
            this.id = this.props.id
        } else {
            this.props.id = this.id
        }
    }

    static create(args) {
        return new this(args)
    }

    static createByViews(views) {
        return new this({ views })
    }

    setProps(props) {
        Object.keys(props).forEach(key => this.setProp(key, props[key]))
        return this
    }

    setProp(key, prop) {
        if (key === "id") {
            this.id = prop
        }
        this.props[key] = prop
        return this
    }

    setViews(views) {
        this.views = views
        return this
    }

    setEvents(events) {
        Object.keys(events).forEach(event => this.setEvent(event, events[event]))
        return this
    }

    setEvent(event, action) {
        this.events[event] = action
        return this
    }

    /**
     * 事件中间件
     *
     * 调用处理函数 `action`，第一个参数为用户定义的事件处理函数
     * 其余参数为 JSBox 传递的参数，如 sender 等
     *
     * @param {string} event 事件名称
     * @param {Function} action 处理事件的函数
     * @returns {this}
     */
    eventMiddleware(event, action) {
        const old = this.events[event]
        this.events[event] = (...args) => {
            if (typeof old === "function") {
                // 调用处理函数
                action(old, ...args)
            }
        }
        return this
    }

    assignEvent(event, action) {
        const old = this.events[event]
        this.events[event] = (...args) => {
            if (typeof old === "function") {
                old(...args)
            }
            action(...args)
        }
        return this
    }

    setLayout(layout) {
        this.layout = layout
        return this
    }

    getView() {
        return this
    }

    get definition() {
        return this.getView()
    }
}

class PageView extends View {
    constructor(args = {}) {
        super(args)
        this.activeStatus = true
    }

    scrollable() {
        let type = this.type
        if (this.views.length > 0) {
            type = this.views[0].type
        }
        return UIKit.scrollViewList.indexOf(type) > -1
    }

    get scrollableView() {
        return this.views[0]
    }

    show() {
        $(this.props.id).hidden = false
        this.activeStatus = true
    }

    hide() {
        $(this.props.id).hidden = true
        this.activeStatus = false
    }

    setHorizontalSafeArea(bool) {
        this.horizontalSafeArea = bool
        return this
    }

    #layout(make, view) {
        make.top.bottom.equalTo(view.super)
        if (this.horizontalSafeArea) {
            make.left.right.equalTo(view.super.safeArea)
        } else {
            make.left.right.equalTo(view.super)
        }
    }

    getView() {
        this.layout = this.#layout
        this.props.clipsToBounds = true
        this.props.hidden = !this.activeStatus
        return super.getView()
    }
}

module.exports = {
    View,
    PageView
}
