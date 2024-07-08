# Toast

> `Toast` 提供短暂的信息展示，用户主动点击会移除该 `Toast`。

## Methods

- `Toast.info(message, opts = {})`
- `Toast.success(message, opts = {})`
- `Toast.warning(message, opts = {})`
- `Toast.error(message, opts = {})`

`opts` 结构如下：

```js
const opts = {
    displayTime = 3, // 显示时间，秒
    labelLines = 2, // 显示行数
    font = $font("default", 26) // 字体
}
```
