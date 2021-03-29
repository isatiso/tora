export interface ToraConfig {
    tora?: {
        port?: number
    }
}

declare global {
    interface ToraConfigSchema {
        tora?: ToraConfig['tora']
    }
}

type Path<T extends Object, Key extends keyof T = keyof T> =
    Key extends string
        ? Exclude<T[Key], undefined> extends Array<any>
        ? `${Key}.${Path<Exclude<T[Key], undefined>, Exclude<keyof Exclude<T[Key], undefined>, keyof Array<any> & string>>}` | Key
        : Exclude<T[Key], undefined> extends Record<string, any>
            ? `${Key}.${Path<Exclude<T[Key], undefined>>}` | Key
            : (Exclude<T[Key], undefined> extends number | string | boolean | null ? Key : never)
        : never;

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

export class ConfigData<T extends Record<string, any>> {

    _cache: {
        [path: string]: any
    } = {}

    constructor(
        private _data: T & ToraConfig
    ) {
        this._cache[''] = JSON.parse(JSON.stringify(this._data))
    }

    /**
     * Return specified <prop> of config object.
     */
    get<K extends Path<T & ToraConfig>>(): T & ToraConfig
    /**
     * Return specified <prop> of config object.
     *
     * @param path(string): name of property
     */
    get<K extends Path<T & ToraConfig>>(path: K): PathValue<T & ToraConfig, K>
    get<K extends Path<T & ToraConfig>>(path?: K): PathValue<T & ToraConfig, K> | T & ToraConfig {
        if (!path) {
            return this._cache['']
        }
        if (this._cache[path] === undefined) {
            const paths = path.split('.')
            let data: any = this._data
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
