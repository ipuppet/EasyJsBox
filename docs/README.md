# EasyJsBox

> 一个简单的JSBox应用框架  
> 框架为模块化设计，可按照自身需求灵活增减模块。

## 开始使用

```js
const { Kernel } = require("./easy-jsbox")

class AppKernel extends Kernel {
    constructor() {
        super()
        this.query = $context.query
    }
}

const kernel = new AppKernel()
kernel.useJsboxNav()
kernel.UIRender({
    views: [{
        type: "label",
        props: {
            text: "Hello World!"
        },
        layout: $layout.fill
    }]
})
```

## 文档索引

[Kernel](./kernel.md)

[Controller](./controller.md)

[Setting](./setting.md)
