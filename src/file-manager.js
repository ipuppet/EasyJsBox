const { UIKit } = require("./ui-kit")
const { Sheet } = require("./sheet")
const { Kernel } = require("./kernel")
const { NavigationView } = require("./navigation-view/navigation-view")
const { NavigationBar } = require("./navigation-view/navigation-bar")

/**
 * @typedef {import("./navigation-view/view-controller").ViewController} ViewController
 */

class FileManager {
    /**
     * @type {ViewController}
     */
    viewController

    constructor() {
        this.listId = "file-manager-list"

        this.edges = 10
        this.iconSize = 25

        this.loadL10n()
    }

    loadL10n() {
        Kernel.l10n(
            "zh-Hans",
            `
            "CONFIRM_DELETE_MSG" = "确认要删除吗";
            "DELETE" = "删除";
            "CANCEL" = "取消";
            "CLOSE" = "关闭";
            "SHARE" = "分享";
            "SAVE" = "保存";
            "SAVE_SUCCESS" = "保存成功";
            `
        )
        Kernel.l10n(
            "en",
            `
            "CONFIRM_DELETE_MSG" = "Are you sure you want to delete";
            "DELETE" = "Delete";
            "CANCEL" = "Cancel";
            "CLOSE" = "Close";
            "SHARE" = "Share";
            "SAVE" = "Save";
            "SAVE_SUCCESS" = "Save Success";
            `
        )
    }

    /**
     *
     * @param {ViewController} viewController
     */
    setViewController(viewController) {
        this.viewController = viewController
    }

    get menu() {
        return {
            items: [
                {
                    title: $l10n("SHARE"),
                    symbol: "square.and.arrow.up",
                    handler: async (sender, indexPath) => {
                        const info = sender.object(indexPath).info.info
                        $share.sheet([$file.absolutePath(info.path)])
                    }
                }
            ]
        }
    }

    delete(info) {
        $file.delete(info.path)
    }

    edit(info) {
        const file = $file.read(info.path)
        if (file.image) {
            $quicklook.open({
                image: file.image
            })
        } else {
            const sheet = new Sheet()
            const id = $text.uuid
            sheet
                .setView({
                    type: "code",
                    layout: $layout.fill,
                    props: {
                        id: id,
                        lineNumbers: true,
                        theme: $device.isDarkMode ? "atom-one-dark" : "atom-one-light",
                        text: file.string,
                        insets: $insets(15, 15, 15, 15)
                    }
                })
                .addNavBar({
                    title: info.file,
                    popButton: {
                        title: $l10n("CLOSE")
                    },
                    rightButtons: [
                        {
                            title: $l10n("SAVE"),
                            tapped: () => {
                                $file.write({
                                    data: $data({ string: $(id).text }),
                                    path: info.path
                                })
                                $ui.success("SAVE_SUCCESS")
                            }
                        }
                    ]
                })
            sheet.init().present()
        }
    }

    getFiles(basePath = "") {
        const files = $file
            .list(basePath)
            .map(file => {
                const path = basePath + "/" + file
                const isDirectory = $file.isDirectory(path)
                return {
                    info: { info: { path, file, isDirectory } },
                    icon: { symbol: isDirectory ? "folder.fill" : "doc" },
                    name: { text: file }
                }
            })
            .sort((a, b) => {
                if (a.info.info.isDirectory !== b.info.info.isDirectory) {
                    return a.info.info.isDirectory ? -1 : 1
                }

                if (a.info.info.isDirectory === b.info.info.isDirectory) {
                    return a.info.info.file.localeCompare(b.info.info.file)
                }
            })

        return files
    }

    get listTemplate() {
        return {
            props: { bgcolor: $color("clear") },
            views: [
                { props: { id: "info" } },
                {
                    type: "image",
                    props: {
                        id: "icon"
                    },
                    layout: (make, view) => {
                        make.centerY.equalTo(view.super)
                        make.left.inset(this.edges)
                        make.size.equalTo(this.iconSize)
                    }
                },
                {
                    type: "label",
                    props: {
                        id: "name",
                        lines: 1
                    },
                    layout: (make, view) => {
                        make.centerY.equalTo(view.super)
                        make.left.equalTo(view.prev.right).offset(this.edges)
                    }
                }
            ]
        }
    }

    #pushPage(title, view) {
        if (this.viewController) {
            const nv = new NavigationView()
            nv.setView(view).navigationBarTitle(title)
            nv.navigationBar.setLargeTitleDisplayMode(NavigationBar.largeTitleDisplayModeNever)
            this.viewController.push(nv)
        } else {
            UIKit.push({
                title,
                views: [view]
            })
        }
    }

    getListView(basePath = "") {
        return {
            // 剪切板列表
            type: "list",
            props: {
                id: this.listId,
                menu: this.menu,
                info: { basePath },
                bgcolor: UIKit.primaryViewBackgroundColor,
                separatorInset: $insets(0, this.edges, 0, 0),
                data: this.getFiles(basePath),
                template: this.listTemplate,
                actions: [
                    {
                        // 删除
                        title: " " + $l10n("DELETE") + " ", // 防止JSBox自动更改成默认的删除操作
                        color: $color("red"),
                        handler: (sender, indexPath) => {
                            const info = sender.object(indexPath).info.info
                            Kernel.deleteConfirm($l10n("CONFIRM_DELETE_MSG") + ' "' + info.file + '" ?', () => {
                                this.delete(info)
                                sender.delete(indexPath)
                            })
                        }
                    }
                ]
            },
            layout: $layout.fill,
            events: {
                pulled: sender => {
                    $delay(0.6, () => {
                        $(this.listId).data = this.getFiles($(this.listId).info.basePath)
                        sender.endRefreshing()
                    })
                },
                didSelect: (sender, indexPath, data) => {
                    const info = data.info.info
                    if (info.isDirectory) {
                        this.#pushPage(info.file, this.getListView(info.path))
                    } else {
                        this.edit(info)
                    }
                }
            }
        }
    }

    push(basePath = "") {
        const pathName = basePath.substring(basePath.lastIndexOf("/"))
        this.#pushPage(pathName, this.getListView(basePath))
    }
}

module.exports = {
    FileManager
}
