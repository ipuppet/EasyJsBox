const { UIKit } = require("./ui-kit")
const { Sheet } = require("./sheet")
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
        this.edges = 10
        this.iconSize = 25
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
        if (file.info?.mimeType?.startsWith("image")) {
            Sheet.quickLookImage(file, info.path.substring(info.path.lastIndexOf("/") + 1))
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
                                $ui.success($l10n("SAVE_SUCCESS"))
                            }
                        }
                    ]
                })
            sheet.init().present()
        }
    }

    getFiles(basePath = "") {
        return $file
            .list(basePath)
            .map(file => {
                const path = basePath + "/" + file
                const isDirectory = $file.isDirectory(path)
                return {
                    info: { info: { path, file, isDirectory } },
                    icon: { symbol: isDirectory ? "folder.fill" : "doc" },
                    name: { text: file },
                    size: { text: isDirectory ? "" : "--" }
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
    }

    async loadFileSize(data) {
        data.map((item, i) => {
            const info = item.info.info
            if (!info.isDirectory) {
                try {
                    data[i].size.text = UIKit.bytesToSize($file.read(info.path).info.size)
                } catch (error) {
                    data[i].size.text = error
                }
            }
        })
        return data
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
                    type: "view",
                    views: [
                        {
                            type: "label",
                            props: {
                                id: "size",
                                color: $color("secondaryText"),
                                lines: 1
                            },
                            layout: (make, view) => {
                                make.height.equalTo(view.super)
                                make.right.inset(this.edges)
                            }
                        },
                        {
                            type: "label",
                            props: {
                                id: "name",
                                lines: 1
                            },
                            layout: (make, view) => {
                                make.height.left.equalTo(view.super)
                                make.right.equalTo(view.prev.left).offset(-this.edges)
                            }
                        }
                    ],
                    layout: (make, view) => {
                        make.height.right.equalTo(view.super)
                        make.left.equalTo(view.prev.right).offset(this.edges)
                    }
                }
            ]
        }
    }

    #pushPage(basePath) {
        const lastSlash = basePath.lastIndexOf("/")
        const title = basePath.substring(lastSlash < 0 ? 0 : lastSlash + 1)
        const view = this.getListView(basePath)
        const tapped = async () => {
            const path = $file.absolutePath(basePath)
            const result = await $ui.alert({
                title: "Path",
                message: path,
                actions: [{ title: $l10n("COPY") }, { title: $l10n("OK") }]
            })
            if (result.index === 0) {
                $clipboard.text = path
                $ui.toast($l10n("COPIED"))
            }
        }

        if (this.viewController) {
            const nv = new NavigationView()
            nv.setView(view).navigationBarTitle(title)
            nv.navigationBar.setLargeTitleDisplayMode(NavigationBar.largeTitleDisplayModeNever)
            nv.navigationBarItems.addRightButton({
                symbol: "info.circle",
                tapped
            })
            this.viewController.push(nv)
        } else {
            UIKit.push({
                title,
                views: [view],
                navButtons: [
                    {
                        symbol: "info.circle",
                        handler: tapped
                    }
                ]
            })
        }
    }

    getListView(basePath = "") {
        return {
            // 剪切板列表
            type: "list",
            props: {
                menu: this.menu,
                bgcolor: UIKit.primaryViewBackgroundColor,
                separatorInset: $insets(0, this.edges, 0, 0),
                data: [],
                template: this.listTemplate,
                actions: [
                    {
                        // 删除
                        title: " " + $l10n("DELETE") + " ", // 防止JSBox自动更改成默认的删除操作
                        color: $color("red"),
                        handler: (sender, indexPath) => {
                            const info = sender.object(indexPath).info.info
                            UIKit.deleteConfirm(
                                $l10n("FILE_MANAGER_DELETE_CONFIRM_MSG") + ' "' + info.file + '" ?',
                                () => {
                                    this.delete(info)
                                    sender.delete(indexPath)
                                }
                            )
                        }
                    }
                ]
            },
            layout: $layout.fill,
            events: {
                ready: sender => {
                    const data = this.getFiles(basePath)
                    sender.data = data
                    this.loadFileSize(data).then(data => {
                        sender.data = data
                    })
                },
                pulled: async sender => {
                    const data = this.getFiles(basePath)
                    sender.data = data
                    sender.data = await this.loadFileSize(data)
                    $delay(0.5, () => {
                        sender.endRefreshing()
                    })
                },
                didSelect: (sender, indexPath, data) => {
                    const info = data.info.info
                    if (info.isDirectory) {
                        this.#pushPage(info.path)
                    } else {
                        this.edit(info)
                    }
                }
            }
        }
    }

    /**
     * @param {string} basePath JSBox path
     */
    push(basePath = "") {
        this.#pushPage(basePath)
    }
}

module.exports = {
    FileManager
}
