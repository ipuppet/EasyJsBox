# Components

> 默认组件

组件需要 `Controller` 和 `View`

`module.exports = { Controller, View }`

## Setting

> 默认提供的设置组件，提供一个设置功能的UI页面和数据存储功能。

## 使用

### `Setting.controller`

> 组件控制器方法

- `constructor(data)`  
初始化，data 对象中的 args 属性即注册时的第二个参数：  
    ```js
    const kernel = new Kernel()
    const MySetting = kernel.registerComponent("Setting", {
        name: "MySetting",
        savePath: "/assets/setting.json", // 数据文件保存路径，其中的数据优先级将高于 `settintPath` 中的默认数据。
        struct: "", // 设置页面的结构，设置此属性时 `structPath` 将失效
        structPath: "/setting.json" // 存放设置页面结构数据的 `.json` 文件
    })
    const MySettingController = MySetting.controller
    // 或 通过 `getComponent(component)` 获取：
    // `const MySettingController = kernel.getComponent("MySetting").controller`
    ```

- `get(key)`  
根据 `key` 获取值。

- `set(key, value)`  
设置键值对，该方法会将数据保存到文件，同时更新内存中的数据，这意味着设置即时生效，可随时调用 `get()` 获取数据。

- `setHook(hook)`  
您可以通过调用来监听 `set()` 方法，每当触发 `set()` 方法时都会调用通过该方法

- `isSecondaryPage(secondaryPage, pop)`  
用来设置是否是二级页面，默认不是。若改为是，则会显示一个标题栏并提供一个返回按钮。
    - `secondaryPage`: 是否是二级页面，默认不是
    - `pop`: 如果设置为二级页面，该参数应该提供一个可执行的函数，提供关闭该页面的方法。如
        ```js
        () => {
            $ui.pop()
            console.log("页面关闭了")
        }
        ```

- `setFooter(footer)`  
用来设置页脚视图，若不调用，将提供默认样式，显示作者和版本号。(作者和版本号将从根目录的 `config.js` 获取)

### Struct

> 组件提供的设置项类型

- switch
    ```json
    {
        "icon": [
            "archivebox",
            "#336699"
        ],
        "title": "USE_COMPRESSED_IMAGE",
        "type": "switch",
        "key": "album.useCompressedImage",
        "value": true
    }
    ```

- stepper
    ```json
    {
        "icon": [
            "rectangle.split.3x1.fill",
            "#FF6666"
        ],
        "title": "SWITCH_INTERVAL",
        "type": "stepper",
        "key": "album.switchInterval",
        "min": 10,
        "max": 60,
        "value": 10
    }
    ```

- string
    ```json
    {
        "icon": [
            "link",
            "#CC6699"
        ],
        "title": "URL_SCHEME",
        "type": "string",
        "key": "album.urlScheme",
        "value": ""
    }
    ```

- number
    ```json
    {
        "icon": [
            "rectangle.split.3x1.fill",
            "#FF6666"
        ],
        "title": "TIME_SPAN",
        "type": "number",
        "key": "timeSpan",
        "value": 10
    }
    ```

- info
    ```json
    {
        "icon": [
            "book.fill",
            "#A569BD"
        ],
        "title": "README",
        "type": "script",
        "key": "readme",
        "value": "this.controller.readme()"
    }
    ```

- script
    ```json
    {
        "icon": [
            "book.fill",
            "#A569BD"
        ],
        "title": "README",
        "type": "script",
        "key": "calendar",
        "value": "this.controller.readme"
    }
    ```

- tab
    ```json
    {
        "icon": [
            "flag.fill",
            "#FFCC00"
        ],
        "title": "FIRST_DAY_OF_WEEK",
        "type": "tab",
        "key": "calendar.firstDayOfWeek",
        "items": [
            "_SUNDAY",
            "_MONDAY"
        ],
        "value": 0
    }
    ```

- color
    ```json
    {
        "icon": [
            "wand.and.rays",
            "orange"
        ],
        "title": "COLOR_TONE",
        "type": "color",
        "key": "calendar.colorTone",
        "value": "orange"
    }
    ```

- menu
    ```json
    {
        "icon": [
            "rectangle.3.offgrid.fill"
        ],
        "title": "RIGHT",
        "type": "menu",
        "key": "right",
        "items": "this.controller.getMenu",
        "value": 0
    }
    ```

- date
  ```json
    {
        "icon": [
            "calendar",
            "#99CC33"
        ],
        "title": "CHOOSE_DATE",
        "type": "date",
        "key": "date",
        "mode": 1,
        "value": 0
    }
    ```

- input
    ```json
    {
        "icon": [
            "pencil.and.ellipsis.rectangle",
            "#A569BD"
        ],
        "title": "TITLE",
        "type": "input",
        "key": "title",
        "value": "Title"
    }
    ```

- icon
    ```json
    {
        "icon": [
            "rectangle.3.offgrid.fill"
        ],
        "title": "ICON",
        "type": "icon",
        "key": "icon",
        "value": "plus"
    }
    ```

待更新