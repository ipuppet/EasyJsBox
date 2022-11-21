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

const { VERSION } = require("./version")
const { Controller } = require("./controller")
const { FileManager } = require("./file-manager")
const { FileStorageParameterError, FileStorageFileNotFoundError, FileStorage } = require("./file-storage")
const { FixedFooterView } = require("./fixed-footer-view")
const { Kernel } = require("./kernel")
const { Matrix } = require("./matrix")
const { Request } = require("./request")
const { Setting } = require("./setting")
const { Sheet } = require("./sheet")
const { TabBarCellView, TabBarHeaderView, TabBarController } = require("./tab-bar")
const { Tasks } = require("./tasks")
const { Toast } = require("./toast")
const { UIKit } = require("./ui-kit")
const { UILoading } = require("./ui-loading")
const { ValidationError } = require("./validation-error")
const { View, PageView } = require("./view")
const { ViewController } = require("./navigation-view/view-controller")
const { NavigationView } = require("./navigation-view/navigation-view")
const { NavigationBar, NavigationBarController } = require("./navigation-view/navigation-bar")
const { NavigationBarItems, BarButtonItem } = require("./navigation-view/navigation-bar-items")
const { SearchBar, SearchBarController } = require("./navigation-view/search-bar")

module.exports = {
    VERSION,
    Controller,
    FileManager,
    FileStorageParameterError,
    FileStorageFileNotFoundError,
    FileStorage,
    FixedFooterView,
    Kernel,
    Matrix,
    Request,
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
