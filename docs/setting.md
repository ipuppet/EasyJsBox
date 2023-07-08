# Setting

> `Setting` 继承自 `Controller`，提供一个设置功能的 UI 页面和数据存储功能。

## 使用

### `Setting`

> 组件控制器方法

- `constructor(args = {})`

    初始化，args 对象中参数均有 `setXxx(value): this` 实现，如 `setSavePath(path)` 返回值为对象自身，因此可以链式调用。

    - `set`

    可用来重写 set 方法，必须同时设置 get 方法。

    设置此参数将导致 savePath 参数失效。

    - `get`

    可用来重写 get 方法，必须同时设置 set 方法。

    设置此参数将导致 savePath 参数失效。

    - `savePath`

    数据文件保存路径。
    
    默认值： "storage/setting.json"

    - `structure`

    结构数据。`structure` 优先级高于 `structurePath`

    若不提供则从 `structurePath` 读取数据。

    - `structurePath`

    结构数据文件路径，如果设置了 `structure` 会使该参数失效。

    默认值： "setting.json"

    - `name`

    实例唯一名称，若不提供则自动生成。

- `get(key, _default = null)`

    根据 `key` 获取值。若未找到将返回 `_default`。

- `set(key, value)`

    不建议使用该方法，所有数据更新推荐仅在生成的 UI 中完成。

    设置键值对，该方法会将数据保存到文件，同时更新内存中的数据，这意味着设置即时生效，可随时调用 `get()` 获取数据。

- `useJsboxNav()`

    调用后将修改 child 类型弹出方式为 JsBox 默认样式。

- `setReadonly()`

    设置为只读模式，尝试写入数据将抛出 `SettingReadonlyError` 错误。

- `setFooter(footer)`

    用来设置页脚视图，若不调用，将提供默认样式，显示作者和版本号（作者和版本号将从根目录的 `config.js` 获取）。

### events

> 通过父类中的方法 `setEvent(event, callback)` 进行设置，详见 [Controller](./controller.md)

- `onSet(key, value)`

    当更新键值对时触发。

- `onChildPush(listView, title)`

    可重写child类型的push事件。

    **Parameter**
    
    - listView 生成的子列表视图对象
    - title 子列表的标题

### Structure

> 组件提供的设置项类型，保存在`setting.json`文件或实例化类时提供的文件中。

#### switch

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

#### stepper

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

#### string

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

#### number

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

#### info

```json
{
    "icon": [
        "book.fill",
        "#A569BD"
    ],
    "title": "Info",
    "type": "info",
    "value": "Text message."
}
```

#### script

如果 `value` 以 `this.method` 开头且结尾无括号，则会自动向该函数传递一个 `animate` 对象。

`this` 为 `Setting` 实例，需要向 `setting.method` 写入方法，如：

```js
setting.method.readme = animate => {
    console.log("Hello World!")
}
```

```js
const animate = {
    start: callable(), // 会出现加载动画
    cancel: callable(), // 会直接恢复箭头图标
    done: callable(), // 会出现对号，然后恢复箭头
    touchHighlightStart: callable(), // 被点击的一行颜色加深
    touchHighlightEnd: callable() // 被点击的一行颜色恢复
}
```

```json
{
    "icon": [
        "book.fill",
        "#A569BD"
    ],
    "title": "README",
    "type": "script",
    "value": "this.method.readme"
}
```

#### tab

`items` 若为字符串，将尝试将其作为函数执行并使用其返回值。

支持 `script` 类型的 `this.method`，其他形式则应为函数，如 `() => [ "Hello World" ]`

可选参数 `values`, 与 `items` 一一对应的数组，同样可传入字符串代码动态执行。

传入 `values` 后，`get` 函数将返回 `values` 内的值。

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
    "values": [
        "sunday",
        "monday"
    ],
    "value": "sunday"
}
```

以上示例中，`get` 函数在选中 `"_SUNDAY"` 时将会返回 `"sunday"`, 若未定义 `values` 则返回数字 `0`。

#### menu

参数 `items`, `values`, 与 `tab` 类型相同。

```json
{
    "icon": [
        "rectangle.3.offgrid.fill"
    ],
    "title": "RIGHT",
    "type": "menu",
    "key": "right",
    "items": "this.method.getMenu",
    "value": 0
}
```
可选参数 `pullDown`，默认 `false`。

启用后，`menu` 项将以 Pull-Down 菜单样式显示，选项内容将不可动态更改。

#### color

调用 `get(key, _default = null)` 方法返回 `$color` 对象。

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

#### date

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

#### input

`secure` 为 `true` 时将以密码框的形式显示。

```json
{
    "icon": [
        "pencil.and.ellipsis.rectangle",
        "#A569BD"
    ],
    "title": "TITLE",
    "type": "input",
    "secure": false,
    "key": "title",
    "value": "Title"
}
```

#### icon

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

#### push

如果 `view` 以 `this.method` 开头且结尾无括号，则会执函数获取子视图，和 `script` 一样需要向 `setting.method` 写入方法。

```json
{
    "icon": [
        "rectangle.3.offgrid.fill"
    ],
    "title": "CHILD",
    "type": "push",
    "key": "my.push",
    "value": "data.save.in.my.push",
    "view": [
        {
            "title": "Section 1",
            "items": []
        },
        {
            "title": "Section 2",
            "items": []
        }
    ]
}
```

#### child

```json
{
    "icon": [
        "rectangle.3.offgrid.fill"
    ],
    "title": "CHILD",
    "type": "child",
    "children": [
        {
            "title": "Section 1",
            "items": []
        },
        {
            "title": "Section 2",
            "items": []
        }
    ]
}
```

#### image

调用 `get(key, _default = null)` 方法返回 `$image` 对象。

```json
{
    "icon": [
        "photo"
    ],
    "title": "IMAGE",
    "type": "image",
    "key": "image"
}
```

## 示例

```js
const { Setting } = require("./easy-jsbox")
const setting = new Setting()
setting
    .setSavePath("/storage/setting.json")
    .setStructure([
        {
            "title": "My setting",
            "items": [
                {
                    "icon": [
                        "house",
                        "white"
                    ],
                    "title": "Hello",
                    "type": "string",
                    "key": "hello",
                    "value": ""
                }
            ]
        }
    ])
    .loadConfig()
setting.set("hello", "world") // 不建议使用
console.log(setting.get("hello"))
```

当调用 `setting.loadConfig()` 后将会从 `this.structure` 初始化数据，此时便可正常使用 `get(key, _default = null)`、`set(key, value)` 方法进行数据读写。