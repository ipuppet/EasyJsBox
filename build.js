const { Parcel } = require("@parcel/core")
const fs = require("fs")
const path = require("path")

const outputName = "easy-jsbox"
const distDir = "dist"
const distEntry = `${outputName}.js`
const entryFilePath = path.join(__dirname, "src", "index.js")
const entryFileContent = fs.readFileSync(entryFilePath, "utf-8")

const bundler = new Parcel({
    entries: entryFilePath,
    defaultConfig: "@parcel/config-default",
    mode: "production",
    targets: {
        main: {
            engines: {}, // Parcel just need this, not sure why
            distDir,
            distEntry,
            includeNodeModules: false
        }
    },
    defaultTargetOptions: {
        shouldOptimize: true,
        shouldScopeHoist: true,
        sourceMaps: false,
        outputFormat: "commonjs"
    }
})

async function build() {
    fs.writeFileSync(entryFilePath, entryFileContent)

    try {
        const { bundleGraph, buildTime } = await bundler.run()
        const bundles = bundleGraph.getBundles()
        console.log(`🔥 Built ${bundles.length} bundles in ${buildTime}ms!`)
    } catch (error) {
        console.error(error.diagnostics)
    }

    fs.writeFileSync(entryFilePath, entryFileContent)
}

build()
