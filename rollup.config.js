const typescript = require('rollup-plugin-typescript2')
const dts = require("rollup-plugin-dts").default

const fs = require('fs')

const typesDir = './types'

const tsconfigOverride = {
    compilerOptions: {
        module: "ESNext",
    }
}

function readTextFileSync(path) {
    return fs.readFileSync(path, "utf-8")
}

function readJsonFileSync(path) {
    if (fs.existsSync(path)) {
        const json = (readTextFileSync(path) || '').trim()
        if (json)
            return JSON.parse(json)
    }
    return undefined
}

function createRollupConfig(externalModules) {
    const external_modules = externalModules || []
    if (!Array.isArray(external_modules))
        throw new Error(`rollup.external_modules is NOT Array`)

    const pkg = readJsonFileSync('./package.json')

    const external = [
        ...Object.keys(pkg.dependencies || {}),
        ...external_modules,
    ]

    const dtsInTypes = fs.existsSync(typesDir) ?
            fs.readdirSync(typesDir).filter(name => name.endsWith(".d.ts"))
                    .map(name => `// merge from ${typesDir}/${name}\n${fs.readFileSync(`${typesDir}/${name}`, 'utf8').trim()}`)
                    .join('\n\n') + '\n\n// generate by rollup-plugin-dts\n'
            : ''

    return [
        {
            input: './src/index.ts',
            external,
            plugins: [
                typescript({
                    tsconfigOverride: tsconfigOverride,
                    cacheRoot: "./out/.rts2_cache"
                })
            ],
            output: [
                {file: pkg.main, format: 'cjs'},
                {file: pkg.module, format: 'es'}
            ]
        },
        {
            input: './src/index.ts',
            external,
            plugins: [
                {
                    name: 'merge .d.ts files',
                    renderChunk(code) {
                        return dtsInTypes + code
                    }
                },
                dts({
                    banner: false,
                    compilerOptions: tsconfigOverride.compilerOptions
                })
            ],
            output: [
                {file: pkg.types, format: "es"}
            ]
        }
    ]
}

const config = createRollupConfig(['stream', 'fs', 'path'])

export default config
