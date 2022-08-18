const { View } = require("./view")

class Matrix extends View {
    titleStyle = {
        font: $font("bold", 21),
        height: 30
    }
    #hiddenViews
    #templateHiddenStatus

    templateIdByIndex(i) {
        if (this.props.template.views[i]?.props?.id === undefined) {
            if (this.props.template.views[i].props === undefined) {
                this.props.template.views[i].props = {}
            }
            this.props.template.views[i].props.id = $text.uuid
        }

        return this.props.template.views[i].props.id
    }

    get templateHiddenStatus() {
        if (!this.#templateHiddenStatus) {
            this.#templateHiddenStatus = {}
            for (let i = 0; i < this.props.template.views.length; i++) {
                // 未定义 id 以及 hidden 的模板默认 hidden 设置为 false
                if (
                    this.props.template.views[i].props.id === undefined &&
                    this.props.template.views[i].props.hidden === undefined
                ) {
                    this.#templateHiddenStatus[this.templateIdByIndex(i)] = false
                }
                // 模板中声明 hidden 的值，在数据中将会成为默认值
                if (this.props.template.views[i].props.hidden !== undefined) {
                    this.#templateHiddenStatus[this.templateIdByIndex(i)] = this.props.template.views[i].props.hidden
                }
            }
        }

        return this.#templateHiddenStatus
    }

    get hiddenViews() {
        if (!this.#hiddenViews) {
            this.#hiddenViews = {}
            // hide other views
            for (let i = 0; i < this.props.template.views.length; i++) {
                this.#hiddenViews[this.templateIdByIndex(i)] = {
                    hidden: true
                }
            }
        }

        return this.#hiddenViews
    }

    #titleToData(title) {
        let hiddenViews = { ...this.hiddenViews }

        // templateProps & title
        Object.assign(hiddenViews, {
            __templateProps: {
                hidden: true
            },
            __title: {
                hidden: false,
                text: title,
                info: { title: true }
            }
        })

        return hiddenViews
    }

    rebuildData(data = []) {
        // rebuild data
        return data.map(section => {
            section.items = section.items.map(item => {
                // 所有元素都重置 hidden 属性
                Object.keys(item).forEach(key => {
                    item[key].hidden = this.templateHiddenStatus[key] ?? false
                })

                // 修正数据
                Object.keys(this.templateHiddenStatus).forEach(key => {
                    if (!item[key]) {
                        item[key] = {}
                    }
                    item[key].hidden = this.templateHiddenStatus[key]
                })

                item.__templateProps = {
                    hidden: false
                }
                item.__title = {
                    hidden: true
                }

                return item
            })

            if (section.title) {
                section.items.unshift(this.#titleToData(section.title))
            }

            return section
        })
    }

    rebuildTemplate() {
        let templateProps = {}
        if (this.props.template.props !== undefined) {
            templateProps = Object.assign(this.props.template.props, {
                id: "__templateProps",
                hidden: false
            })
        }
        this.props.template.props = {}

        // rebuild template
        const templateViews = [
            {
                // templateProps
                type: "view",
                props: templateProps,
                layout: $layout.fill
            },
            {
                // title
                type: "label",
                props: {
                    id: "__title",
                    hidden: true,
                    font: this.titleStyle.font
                },
                layout: (make, view) => {
                    make.top.inset(-(this.titleStyle.height / 4) * 3)
                    make.height.equalTo(this.titleStyle.height)
                    make.width.equalTo(view.super.safeArea)
                }
            }
        ].concat(this.props.template.views)
        this.props.template.views = templateViews
    }

    insert(data, withTitleOffset = true) {
        data.indexPath = this.indexPath(data.indexPath, withTitleOffset)
        return $(this.id).insert(data)
    }

    delete(indexPath, withTitleOffset = true) {
        indexPath = this.indexPath(indexPath, withTitleOffset)
        return $(this.id).delete(indexPath)
    }

    object(indexPath, withTitleOffset = true) {
        indexPath = this.indexPath(indexPath, withTitleOffset)
        return $(this.id).object(indexPath)
    }

    cell(indexPath, withTitleOffset = true) {
        indexPath = this.indexPath(indexPath, withTitleOffset)
        return $(this.id).cell(indexPath)
    }

    /**
     * 获得修正后的 indexPath
     * @param {$indexPath||number} indexPath
     * @param {boolean} withTitleOffset 输入的 indexPath 是否已经包含了标题列。通常自身事件返回的 indexPath 视为已包含，使用默认值即可。
     * @returns {$indexPath}
     */
    indexPath(indexPath, withTitleOffset) {
        let offset = withTitleOffset ? 0 : 1
        if (typeof indexPath === "number") {
            indexPath = $indexPath(0, indexPath)
        }
        indexPath = $indexPath(indexPath.section, indexPath.row + offset)
        return indexPath
    }

    update(data) {
        this.props.data = this.rebuildData(data)
        $(this.id).data = this.props.data
    }

    getView() {
        // rebuild data, must first
        this.props.data = this.rebuildData(this.props.data)

        // rebuild template
        this.rebuildTemplate()

        // itemSize event
        this.setEvent("itemSize", (sender, indexPath) => {
            const info = sender.object(indexPath)?.__title?.info
            if (info?.title) {
                return $size(Math.max($device.info.screen.width, $device.info.screen.height), 0)
            }
            const columns = this.props.columns ?? 2
            const spacing = this.props.spacing ?? 15
            const width =
                this.props.itemWidth ??
                this.props.itemSize?.width ??
                (sender.super.frame.width - spacing * (columns + 1)) / columns
            const height = this.props.itemHeight ?? this.props.itemSize?.height ?? 100
            return $size(width, height)
        })

        return this
    }
}

module.exports = {
    Matrix
}
