const fs = require("fs")
const path = require("path")
const esbuild = require("esbuild")

function processFile(pathName) {
    try {
        const data = fs.readFileSync(pathName, "utf8")

        let start = data.lastIndexOf("require(")
        start = start === -1 ? 0 : data.indexOf(")", start) + 1
        let end = data.lastIndexOf("module.exports")
        if (end === -1) end = undefined

        const content = data.substring(start, end)

        const classes = []
        let index = content.indexOf("class ")
        while (index !== undefined && index >= 0) {
            let next = content.indexOf("class ", index + 1)
            if (next < 0) next = undefined
            classes.push(content.substring(index, next).trim())
            index = next
        }

        return classes
    } catch (error) {
        console.error(error)
    }
}

function getClasses(pathName) {
    const classes = []
    const classesWithExtends = []
    const classesMap = {}
    fs.readdirSync(pathName).forEach(item => {
        const itemPath = path.join(pathName, item)
        const stat = fs.lstatSync(itemPath)
        let items
        if (stat.isDirectory()) {
            const subItems = getClasses(itemPath)
            classes.push(...subItems.classes)
            classesWithExtends.push(...subItems.classesWithExtends)
            Object.assign(classesMap, subItems.classesMap)
        } else {
            items = [...processFile(itemPath)]
            items.forEach(item => {
                const className = item.substring(6, item.indexOf(" ", 6))
                if (item.indexOf(" extends ") > 0) {
                    classesWithExtends.push(item)
                } else {
                    classes.push(item)
                }
                classesMap[className] = true
            })
        }
    })

    return { classes, classesWithExtends, classesMap }
}

function combineFiles(pathName) {
    const { classes, classesWithExtends, classesMap } = getClasses(pathName)
    const tmp = []
    classesWithExtends.forEach(item => {
        const className = item.substring(6, item.indexOf(" ", 6))
        const start = item.indexOf(" ", className.length + 7) + 1
        const extendedClass = item.substring(start, item.indexOf(" ", start))
        if (!classesMap[extendedClass]) {
            classes.push(item)
        } else {
            tmp.push(item)
        }
    })

    return {
        content: classes.concat(tmp).join("\n"),
        index: `\n\nmodule.exports = {\n${Object.keys(classesMap).join(",\n")}\n}\n`
    }
}

function getVersion() {
    const content = fs.readFileSync("./src/version.js", "utf8")
    return content.match(/.*VERSION.+\"([0-9\.]+)\"/)[1]
}

async function main() {
    // make sure file is empty
    fs.writeFileSync("./dist/combined.js", "")
    fs.appendFileSync("./dist/combined.js", `const VERSION = "${getVersion()}"\n`)
    const { content, index } = combineFiles("./src")
    fs.appendFileSync("./dist/combined.js", content + index)

    // build
    await esbuild.build({
        bundle: true,
        minify: true,
        format: "cjs",
        entryPoints: ["./dist/combined.js"],
        outfile: "./dist/easy-jsbox.js"
    })

    fs.unlinkSync("./dist/combined.js")
}

main()
