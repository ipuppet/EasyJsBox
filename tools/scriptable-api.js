// TODO Request
class Request {
    url
    method = "GET"
    headers = {}
    body
    timeoutInterval
    onRedirect
    response
    allowInsecureRequest

    constructor(url) {
        this.url = url
    }

    load() {
        return $http.request({
            method: this.method,
            url: this.url,
            header: this.headers,
            body: this.body
        })
    }

    async loadString() {
        const resp = await this.load()
        if (typeof resp.data !== "string") {
            resp.data = JSON.stringify(resp.data)
        }

        return resp
    }

    loadJSON() {
        return this.load()
    }

    async loadImage() {
        const resp = await this.load()
        return new Image(resp?.rawData?.image)
    }

    addParameterToMultipart(name, value) {}

    addFileDataToMultipart(data, mimeType, name, filename) {}

    addFileToMultipart(filePath, name, filename) {}

    addImageToMultipart(image, name, filename) {}
}

// TODO Font
class Font {
    name
    size

    constructor(name, size) {
        this.name = name
        this.size = size
    }

    static boldSystemFont(size) {
        return new Font("bold", size)
    }

    get definition() {
        return this.name ? $font(this.name, this.size) : $font(this.size)
    }
}

class Color {
    #color
    #hex
    #red
    #green
    #blue
    #alpha

    get hex() {
        return this.#hex
    }
    get red() {
        return this.#red
    }
    get green() {
        return this.#green
    }
    get blue() {
        return this.#blue
    }
    get alpha() {
        return this.#alpha
    }

    static black() {
        return new Color("black")
    }
    static darkGray() {
        return new Color("darkGray")
    }
    static lightGray() {
        return new Color("lightGray")
    }
    static white() {
        return new Color("white")
    }
    static gray() {
        return new Color("gray")
    }
    static red() {
        return new Color("red")
    }
    static green() {
        return new Color("green")
    }
    static blue() {
        return new Color("blue")
    }
    static cyan() {
        return new Color("cyan")
    }
    static yellow() {
        return new Color("yellow")
    }
    static magenta() {
        return new Color("magenta")
    }
    static orange() {
        return new Color("orange")
    }
    static purple() {
        return new Color("purple")
    }
    static brown() {
        return new Color("brown")
    }
    static clear() {
        return new Color("clear")
    }

    /**
     *
     * @param {string} hex
     * @param {number} alpha
     */
    constructor(hex, alpha = 1) {
        this.#hex = hex
        this.#alpha = alpha
        this.#initRGBA()
    }

    #initRGBA() {
        this.#color = $color(this.#hex)
        if (this.#alpha !== 1) {
            const components = this.#color.components
            this.#red = components.red
            this.#green = components.green
            this.#blue = components.blue
            this.#color = $color($rgba(this.#red, this.#green, this.#blue, this.#alpha))
        }
    }

    /**
     *
     * @param {Color} lightColor
     * @param {Color} darkColor
     * @returns
     */
    static dynamic(lightColor, darkColor) {
        return {
            definition: $color(lightColor.definition, darkColor.definition)
        }
    }

    get definition() {
        return this.#color
    }
}

class Size {
    width
    height
    constructor(width, height) {
        this.width = width
        this.height = height
    }

    get definition() {
        return $size(this.width, this.height)
    }
}

class Rect {
    x
    y
    minX
    maxX
    minY
    maxY
    width
    height

    constructor(x, y, width, height) {
        this.x = x
        this.y = y

        this.maxX = x
        this.minX = x
        this.maxY = y
        this.minY = y

        this.width = width
        this.height = height
    }

    get origin() {
        return new Point(this.x, this.y)
    }

    /**
     * @param {Point} point
     */
    set origin(point) {
        this.x = point.x
        this.y = point.y
    }

    get size() {
        return new Size(this.width, this.height)
    }

    /**
     * @param {Size} size
     */
    set size(size) {
        this.width = size.width
        this.height = size.height
    }

    get definition() {
        let x = this.x,
            y = this.y
        if (x > this.maxX) {
            x = this.maxX
        }
        if (x < this.minX) {
            x = this.minX
        }
        if (y > this.maxY) {
            y = this.maxY
        }
        if (y < this.minY) {
            y = this.minY
        }

        return $rect(x, y, this.width, this.height)
    }
}

// TODO Path
class Path {
    renderQueue = []

    /**
     *
     * @param {Point} point
     */
    move(point) {}

    /**
     *
     * @param {Point} point
     */
    addLine(point) {}

    /**
     *
     * @param {Rect} rect
     */
    addRect(rect) {}

    /**
     *
     * @param {Rect} rect
     */
    addEllipse(rect) {}

    /**
     *
     * @param {Rect} rect
     * @param {number} cornerWidth
     * @param {number} cornerHeight
     */
    addRoundedRect(rect, cornerWidth, cornerHeight) {
        rect = rect.definition

        this.renderQueue.push(ctx => {
            // TODO 圆角矩形
        })
    }

    /**
     *
     * @param {Point} point
     * @param {Point} control1
     * @param {Point} control2
     */
    addCurve(point, control1, control2) {}

    /**
     *
     * @param {Point} point
     * @param {Point} control
     */
    addQuadCurve(point, control) {}

    /**
     *
     * @param {Point[]} points
     */
    addLines(points) {}

    /**
     *
     * @param {Rect[]} rects
     */
    addRects(rects) {}

    closeSubpath() {}
}

// TODO DrawContext
class DrawContext {
    size
    respectScreenScale = false
    opaque = true

    renderQueue = []

    getImage() {
        const options = {
            size: this.size.definition,
            opaque: this.opaque,
            scale: this.respectScreenScale ? 0 : 1
        }
        return new Image(
            $imagekit.render(options, ctx => {
                this.renderQueue.forEach(render => {
                    render(ctx)
                })
            })
        )
    }

    /**
     *
     * @param {Image} image
     * @param {Rect} rect
     */
    drawImageInRect(image, rect) {
        this.renderQueue.push(ctx => {
            ctx.drawImage(rect.definition, image.definition)
        })
    }

    drawImageAtPoint() {}

    /**
     *
     * @param {Color} color
     */
    setFillColor(color) {
        this.renderQueue.push(ctx => {
            ctx.fillColor = color.definition
        })
    }

    /**
     *
     * @param {Color} color
     */
    setStrokeColor(color) {
        this.renderQueue.push(ctx => {
            ctx.fillColor = color.definition
        })
    }

    setLineWidth() {}

    /**
     *
     * @param {Rect} rect
     */
    fill(rect) {
        this.renderQueue.push(ctx => {
            ctx.fillRect(rect.definition)
        })
    }

    /**
     *
     * @param {Rect} rect
     */
    fillRect(rect) {
        this.fill(rect)
    }

    fillEllipse() {}
    stroke() {}
    strokeRect() {}
    strokeEllipse() {}

    /**
     *
     * @param {Path} path
     */
    addPath(path) {
        this.renderQueue = this.renderQueue.concat(path.renderQueue)
    }
    strokePath() {
        this.renderQueue.push(ctx => {
            ctx.strokePath()
        })
    }
    fillPath() {
        this.renderQueue.push(ctx => {
            ctx.fillPath()
        })
    }

    drawText() {}
    drawTextInRect() {}
    setFont() {}
    setTextColor() {}
    setTextAlignedLeft() {}
    setTextAlignedCenter() {}
    setTextAlignedRight() {}
}

class Data {
    #data

    constructor(data) {
        this.#data = data
    }

    /**
     *
     * @param {string} string
     * @returns
     */
    static fromString(string) {
        return new Data($data({ string }))
    }

    /**
     *
     * @param {string} filePath
     * @returns
     */
    static fromFile(filePath) {
        return new Data($data({ path: filePath }))
    }

    /**
     *
     * @param {string} base64String
     * @returns
     */
    static fromBase64String(base64String) {
        return new Data($data({ base64: base64String }))
    }

    /**
     *
     * @param {Image} image
     * @returns
     */
    static fromJPEG(image) {
        return new Data(image.definition.png)
    }

    /**
     *
     * @param {Image} image
     * @returns
     */
    static fromPNG(image) {
        return new Data(image.definition.png)
    }

    toRawString() {
        return this.#data.string
    }

    toBase64String() {
        return $text.base64Encode(this.toRawString())
    }

    getBytes() {
        return this.#data.byteArray
    }

    get definition() {
        return this.#data
    }
}

class Image {
    size
    #image

    constructor(image) {
        this.#image = image
    }

    /**
     *
     * @param {string} filePath
     * @returns
     */
    static fromFile(filePath) {
        return new Image($image(filePath))
    }

    /**
     *
     * @param {Data} data
     * @returns
     */
    static fromData(data) {
        return new Image(data.definition.image)
    }

    get definition() {
        return this.#image
    }
}

class Point {
    x
    y

    constructor(x, y) {
        this.x = x
        this.y = y
    }

    get definition() {
        return $point(this.x, this.y)
    }
}

class LinearGradient {
    colors = []
    locations = []
    startPoint
    endPoint

    get definition() {
        return {
            type: "gradient",
            props: {
                startPoint: this.startPoint.definition,
                endPoint: this.endPoint.definition,
                locations: this.locations,
                colors: this.colors.map(color => color.definition)
            }
        }
    }
}

class Widget {
    #url = ""

    set url(url) {
        this.#url = url
    }

    get url() {
        // TODO 可对 url 进行处理
        return this.#url
    }
}

class WidgetSpacer extends Widget {
    length

    constructor(length) {
        super()
        this.length = length
    }

    get definition() {
        return {
            type: "spacer",
            props: this.length
                ? {}
                : {
                      minLength: this.length
                  }
        }
    }
}

class WidgetText extends Widget {
    text = ""
    textColor
    font
    textOpacity = 1
    lineLimit = 0
    minimumScaleFactor = 1
    shadowColor
    shadowRadius
    shadowOffset

    #alignment

    constructor(text) {
        super()
        this.text = text
    }

    leftAlignText() {
        this.#alignment = $widget.alignment.leading
    }
    centerAlignText() {
        this.#alignment = $widget.alignment.center
    }
    rightAlignText() {
        this.#alignment = $widget.alignment.trailing
    }

    get definition() {
        const view = {
            type: "text",
            props: {
                text: this.text,
                frame: {},
                opacity: this.textOpacity,
                lineLimit: this.lineLimit,
                minimumScaleFactor: this.minimumScaleFactor,
                link: this.url
            }
        }

        if (this.textColor) {
            view.props.color = this.textColor
        }
        if (this.font) {
            view.props.font = this.font
        }
        if (this.#alignment) {
            Object.assign(view.props.frame, {
                alignment: this.#alignment
            })
        }

        return view
    }
}

// TODO WidgetDate
class WidgetDate extends WidgetText {
    date

    constructor(date) {
        super()
        this.date = date
    }
}

class WidgetImage extends Widget {
    image
    resizable
    imageSize
    imageOpacity
    cornerRadius = 0
    borderWidth = 0
    borderColor = Color.black()
    containerRelativeShape = false
    tintColor
    scaledToFit = false
    scaledToFill = false

    #alignment

    constructor(image) {
        super()
        this.image = image
    }

    leftAlignImage() {
        this.#alignment = $widget.alignment.leading
    }
    centerAlignImage() {
        this.#alignment = $widget.alignment.center
    }
    rightAlignImage() {
        this.#alignment = $widget.alignment.trailing
    }

    applyFittingContentMode() {
        this.scaledToFit = true
    }
    applyFillingContentMode() {
        this.scaledToFill = true
    }

    get definition() {
        const view = {
            type: "image",
            props: {
                image: this.image.definition,
                frame: {},
                resizable: this.resizable,
                opacity: this.imageOpacity,
                border: {
                    color: this.borderColor.definition,
                    width: this.borderWidth
                },
                link: this.url,
                scaledToFit: this.scaledToFit,
                scaledToFill: this.scaledToFill
            },
            modifiers: [
                this.tintColor
                    ? {
                          color: this.tintColor.definition
                      }
                    : {},
                this.containerRelativeShape
                    ? {
                          cornerRadius: this.cornerRadius
                      }
                    : {}
            ]
        }

        if (this.imageSize) {
            Object.assign(view.props.frame, {
                width: this.imageSize.definition.width,
                height: this.imageSize.definition.height
            })
        }
        if (this.#alignment) {
            Object.assign(view.props.frame, {
                alignment: this.#alignment
            })
        }

        return view
    }
}

class WidgetStack {
    backgroundColor
    backgroundImage
    backgroundGradient
    spacing = 0
    size
    cornerRadius
    borderWidth
    borderColor
    url

    #padding = 0
    #layoutDirection = "hstack"
    #alignment

    viewStack = []

    /**
     *
     * @param {string} text
     */
    addText(text) {
        const widget = new WidgetText(text)
        this.viewStack.push(widget)
        return widget
    }

    /**
     *
     * @param {Date} date
     */
    addDate(date) {
        const widget = new WidgetDate(date)
        this.viewStack.push(widget)
        return widget
    }

    /**
     *
     * @param {Image} image
     */
    addImage(image) {
        const widget = new WidgetImage(image)
        this.viewStack.push(widget)
        return widget
    }

    /**
     *
     * @param {WidgetSpacer} length
     */
    addSpacer(length) {
        const widget = new WidgetSpacer(length)
        this.viewStack.push(widget)
        return widget
    }

    addStack() {
        const widget = new WidgetStack()
        this.viewStack.push(widget)
        return widget
    }

    setPadding(top, leading, bottom, trailing) {
        this.#padding = $insets(top, leading, bottom, trailing)
    }

    useDefaultPadding() {
        this.#padding = undefined
    }

    topAlignContent() {
        this.#alignment = $widget.alignment.top
    }
    centerAlignContent() {
        this.#alignment = $widget.alignment.center
    }
    bottomAlignContent() {
        this.#alignment = $widget.alignment.bottom
    }

    layoutHorizontally() {
        this.#layoutDirection = "hstack"
    }
    layoutVertically() {
        this.#layoutDirection = "vstack"
    }

    get definition() {
        let background
        if (this.backgroundColor) {
            background = this.backgroundColor.definition
        } else if (this.backgroundImage) {
            background = this.backgroundImage.definition
        } else if (this.backgroundGradient) {
            background = this.backgroundGradient.definition
        }

        const view = {
            type: this.#layoutDirection,
            props: {
                background,
                frame: {},
                spacing: this.spacing,
                border: {
                    color: this.borderColor.definition,
                    width: this.borderWidth
                },
                link: this.url
            },
            modifiers: [
                this.cornerRadius
                    ? {
                          cornerRadius: this.cornerRadius
                      }
                    : {}
            ],
            views: this.viewStack
        }

        if (this.#padding !== undefined) {
            view.props.padding = this.#padding
        }
        if (this.size) {
            Object.assign(view.props.frame, {
                width: this.size.definition.width,
                height: this.size.definition.height
            })
        }
        if (this.#alignment) {
            Object.assign(view.props.frame, {
                alignment: this.#alignment
            })
        }

        return view
    }
}

class ListWidget extends WidgetStack {
    refreshAfterDate

    setTimeline() {
        $widget.setTimeline({
            policy: {
                afterDate: this.refreshAfterDate
            },
            render: ctx => {
                return this.definition
            }
        })
    }

    #present() {
        if ($app.env !== $env.app) {
            return
        }
        this.setTimeline()
    }

    presentSmall() {
        this.#present()
    }
    presentMedium() {
        this.#present()
    }
    presentLarge() {
        this.#present()
    }
    presentExtraLarge() {
        this.#present()
    }
}

class Script {
    static name() {
        return $addin.current.name
    }

    static complete() {
        $app.close()
    }

    static setShortcutOutput(result) {
        $intents.finish(result)
    }

    /**
     *
     * @param {ListWidget} widget
     */
    static setWidget(widget) {
        widget.setTimeline()
    }
}

// TODO Device
class Device {
    static name() {
        return $device.info.name
    }

    static systemVersion() {
        return $device.info.version
    }

    static model() {
        return $device.info.model
    }

    static locale() {
        return $device.info.language
    }
}

module.exports = {
    Request,
    Font,
    Color,
    Size,
    Rect,
    Path,
    DrawContext,
    Data,
    Image,
    Point,
    LinearGradient,
    WidgetSpacer,
    WidgetText,
    WidgetDate,
    WidgetImage,
    WidgetStack,
    ListWidget,
    Script,
    Device
}
