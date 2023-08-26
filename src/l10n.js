class L10n {
    static l10n(language, content, override) {
        if (typeof content === "string") {
            const strings = {}
            const strArr = content.split(";")
            strArr.forEach(line => {
                line = line.trim()
                if (line !== "") {
                    const kv = line.split("=")
                    strings[kv[0].trim().slice(1, -1)] = kv[1].trim().slice(1, -1)
                }
            })
            content = strings
        }
        const strings = $app.strings
        if (override) {
            Object.assign(strings[language], content)
        } else {
            for (const key in content) {
                if (!strings[language][key]) {
                    strings[language][key] = content[key]
                }
            }
        }
        $app.strings = strings
    }

    static set(language, content) {
        this.l10n(language, content, true)
    }

    static add(language, content) {
        this.l10n(language, content, false)
    }

    static init() {
        // setting
        this.add("zh-Hans", {
            OK: "好",
            DONE: "完成",
            CANCEL: "取消",
            CLEAR: "清除",
            BACK: "返回",
            ERROR: "发生错误",
            SUCCESS: "成功",
            INVALID_VALUE: "非法参数",
            CONFIRM_CHANGES: "数据已变化，确认修改？",

            SETTING: "设置",
            GENERAL: "一般",
            ADVANCED: "高级",
            TIPS: "小贴士",
            COLOR: "颜色",
            COPY: "复制",
            COPIED: "复制成功",

            JSBOX_ICON: "JSBox 内置图标",
            SF_SYMBOLS: "SF Symbols",
            IMAGE_BASE64: "图片 / base64",

            PREVIEW: "预览",
            SELECT_IMAGE_PHOTO: "从相册选择图片",
            SELECT_IMAGE_ICLOUD: "从 iCloud 选择图片",
            CLEAR_IMAGE: "清除图片",
            NO_IMAGE: "无图片",

            ABOUT: "关于",
            VERSION: "Version",
            AUTHOR: "作者",
            AT_BOTTOM: "已经到底啦~"
        })
        this.add("en", {
            OK: "OK",
            DONE: "Done",
            CANCEL: "Cancel",
            CLEAR: "Clear",
            BACK: "Back",
            ERROR: "Error",
            SUCCESS: "Success",
            INVALID_VALUE: "Invalid value",
            CONFIRM_CHANGES: "The data has changed, confirm the modification?",

            SETTING: "Setting",
            GENERAL: "General",
            ADVANCED: "Advanced",
            TIPS: "Tips",
            COLOR: "Color",
            COPY: "Copy",
            COPIED: "Copide",

            JSBOX_ICON: "JSBox in app icon",
            SF_SYMBOLS: "SF Symbols",
            IMAGE_BASE64: "Image / base64",

            PREVIEW: "Preview",
            SELECT_IMAGE_PHOTO: "Select From Photo",
            SELECT_IMAGE_ICLOUD: "Select From iCloud",
            CLEAR_IMAGE: "Clear Image",
            NO_IMAGE: "No Image",

            ABOUT: "About",
            VERSION: "Version",
            AUTHOR: "Author",
            AT_BOTTOM: "It's the end~"
        })

        // uikit
        this.add("zh-Hans", { DELETE_CONFIRM_TITLE: "删除前确认" })
        this.add("en", { DELETE_CONFIRM_TITLE: "Delete Confirmation" })

        // file-manager
        this.add("zh-Hans", {
            FILE_MANAGER_DELETE_CONFIRM_MSG: "确认要删除吗",
            DELETE: "删除",
            CANCEL: "取消",
            CLOSE: "关闭",
            SHARE: "分享",
            SAVE: "保存",
            SAVE_SUCCESS: "保存成功"
        })
        this.add("en", {
            FILE_MANAGER_DELETE_CONFIRM_MSG: "Are you sure you want to delete",
            DELETE: "Delete",
            CANCEL: "Cancel",
            CLOSE: "Close",
            SHARE: "Share",
            SAVE: "Save",
            SAVE_SUCCESS: "Save Success"
        })
    }
}

module.exports = {
    L10n
}
