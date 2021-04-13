/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

declare global {

    /**
     * @public
     *
     * Modify "ToraConfigSchema" via global declaration merging.
     *
     * e.g.
     * ```typescript
     *
     * // If you write below code into a .ts file and load it,
     *
     * declare global {
     *     interface ToraConfigSchema {
     *         sample: {
     *             sample_property1: 255
     *             sample_property2: 'sample'
     *         }
     *     }
     * }
     *
     * // The "ToraConfigSchema" will become like this:
     *
     * interface ToraConfigSchema {
     *     sample: {
     *         sample_property1: 255
     *         sample_property2: 'sample'
     *     }
     *     tora?: {
               port?: number
           }
     * }
     *
     * ```
     *
     * @category ConfigSchema
     */
    interface ToraConfigSchema {
        tora?: {
            port?: number
        }
    }
}

/**
 * @private
 * Figure JSON path of a JSON object.
 */
type Path<T extends Object, Key extends keyof T = keyof T> =
    Key extends string
        ? Exclude<T[Key], undefined> extends Array<any>
        ? `${Key}.${Path<Exclude<T[Key], undefined>, Exclude<keyof Exclude<T[Key], undefined>, keyof Array<any> & string>>}` | Key
        : Exclude<T[Key], undefined> extends Record<string, any>
            ? `${Key}.${Path<Exclude<T[Key], undefined>>}` | Key
            : (Exclude<T[Key], undefined> extends number | string | boolean | null ? Key : never)
        : never;

/**
 * @private
 * Figure value of specify JSON path from type "Path<T>".
 */
type PathValue<T extends Object, P extends Path<T>> =
    P extends `${infer Key}.${infer Rest}`
        ? Key extends keyof T
        ? Rest extends Path<Exclude<T[Key], undefined>>
            ? PathValue<Exclude<T[Key], undefined>, Rest>
            : never
        : never
        : P extends keyof T
        ? T[P]
        : never;

/**
 * Method {@link Platform.load_config} will read config file and save data as "ConfigData".
 *
 * NPM package [tora-check](https://www.npmjs.com/package/tora-check) gives a way to check configuration data by type <ToraConfigSchema>.
 *
 * @category Builtin Component
 */
export class ConfigData {

    /**
     * @private
     * Cache for search results.
     */
    private _cache: {
        [path: string]: any
    } = {}

    /**
     * @param data configuration data.
     */
    constructor(
        private data: ToraConfigSchema
    ) {
        this._cache[''] = JSON.parse(JSON.stringify(this.data))
    }

    /**
     * Return full configuration data object.
     */
    get<K extends Path<ToraConfigSchema>>(): ToraConfigSchema
    /**
     * Find value by specified JSON path and return it.
     *
     * @param path JSON path of configuration data.
     */
    get<K extends Path<ToraConfigSchema>>(path: K): PathValue<ToraConfigSchema, K>
    get<K extends Path<ToraConfigSchema>>(path?: K): PathValue<ToraConfigSchema, K> | ToraConfigSchema {
        if (!path) {
            return this._cache['']
        }
        if (this._cache[path] === undefined) {
            const paths = path.split('.')
            let data: any = this.data
            for (const p of paths) {
                data = data?.[p]
                if (data === undefined) {
                    data = null
                    break
                }
            }
            this._cache[path] = JSON.parse(JSON.stringify(data))
        }
        return this._cache[path] as any
    }
}
