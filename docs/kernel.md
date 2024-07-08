# Kernel

> Kernel 类应该是一个应用程序的核心，应该只有全局唯一的实例

## Property

- `this.startTime: Number`

    应用启动时的时间戳

## Methods

- `useJsboxNav()`

    使用 JSBox 的 nav 样式。若不调用则默认隐藏。

- `setTitle(title)`

    设置 JSBox nav 标题，一般与 useJsboxNav 配合使用，可动态更改 JSBox nav 的标题。

    **Parameter**

  - title: String 标题

- `setNavButtons(buttons)`

    设置 JSBox nav 按钮，一般与 useJsboxNav 配合使用。需要注意，该按钮无法动态更改。

    **Parameter**

  - buttons: Array 按钮数组，与 JSBox 原生格式一致。

- `UIRender(view)`

    渲染视图，应该始终通过该方法进行渲染。

    该方法将自动注册事件 `"interfaceOrientationEvent"` 用以监听屏幕方向：

    ```js
    $app.notify({
        name: "interfaceOrientationEvent",
        object: {
            statusBarOrientation: UIKit.statusBarOrientation,
            isHorizontal: UIKit.isHorizontal
        }
    })
    ```

    **Parameter**

  - view: Object 视图对象，与 JSBox 原生格式一致。

- `async checkUpdate(callback)`

    检查框架自身是否需要更新

    **Parameter**

  - callback(newScriptContent): Function

    该回调函数仅在需要更新时才被调用，否则该函数静默。

    **Parameter**

  - newScriptContent: String 从 Github 获取的最新脚本内容。
