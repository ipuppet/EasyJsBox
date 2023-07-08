// cannot use () => {}
String.prototype.trim = function (char, type) {
    if (char) {
        if (type === "l") {
            return this.replace(new RegExp("^\\" + char + "+", "g"), "")
        } else if (type === "r") {
            return this.replace(new RegExp("\\" + char + "+$", "g"), "")
        }
        return this.replace(new RegExp("^\\" + char + "+|\\" + char + "+$", "g"), "")
    }
    return this.replace(/^\s+|\s+$/g, "")
}

const { VERSION } = require("./src/version")
const { Alert, AlertAction } = require("./src/alert")
const { Controller } = require("./src/controller")
const { FileManager } = require("./src/file-manager")
const { FileStorageParameterError, FileStorageFileNotFoundError, FileStorage } = require("./src/file-storage")
const { FixedFooterView } = require("./src/fixed-footer-view")
const { Kernel } = require("./src/kernel")
const { Logger } = require("./src/logger")
const { Matrix } = require("./src/matrix")
const { Request } = require("./src/request")
const { WebDAV } = require("./src/webdav")
const { Setting } = require("./src/setting/setting")
const { Sheet } = require("./src/sheet")
const { TabBarCellView, TabBarHeaderView, TabBarController } = require("./src/tab-bar")
const { Tasks } = require("./src/tasks")
const { Toast } = require("./src/toast")
const { UIKit } = require("./src/ui-kit")
const { UILoading } = require("./src/ui-loading")
const { ValidationError } = require("./src/validation-error")
const { View, PageView } = require("./src/view")
const { ViewController } = require("./src/navigation-view/view-controller")
const { NavigationView } = require("./src/navigation-view/navigation-view")
const { NavigationBar, NavigationBarController } = require("./src/navigation-view/navigation-bar")
const { NavigationBarItems, BarButtonItem } = require("./src/navigation-view/navigation-bar-items")
const { SearchBar, SearchBarController } = require("./src/navigation-view/search-bar")

module.exports = {
    VERSION,
    Alert,
    AlertAction,
    Controller,
    FileManager,
    FileStorageParameterError,
    FileStorageFileNotFoundError,
    FileStorage,
    FixedFooterView,
    Kernel,
    Logger,
    Matrix,
    Request,
    WebDAV,
    Setting,
    Sheet,
    TabBarCellView,
    TabBarHeaderView,
    TabBarController,
    Tasks,
    Toast,
    UIKit,
    UILoading,
    ValidationError,
    View,
    PageView,
    ViewController,
    NavigationView,
    NavigationBar,
    NavigationBarController,
    NavigationBarItems,
    BarButtonItem,
    SearchBar,
    SearchBarController
}
